import Ajv, { JTDDataType, ValidateFunction } from "ajv/dist/jtd";
import axios from "axios";
import { sleep } from "../../utils/sleep";

// Type examples:
// - group: https://www.metaculus.com/api2/questions/9866/
// - claim: https://www.metaculus.com/api2/questions/9668/
// - subquestion forecast: https://www.metaculus.com/api2/questions/10069/
// - basic forecast: https://www.metaculus.com/api2/questions/11005/

const RETRY_SLEEP_TIME = 5000;

const commonProps = {
  id: {
    type: "uint32",
  },
  title: {
    type: "string",
  },
} as const;

const predictableProps = {
  publish_time: {
    type: "string",
  },
  close_time: {
    type: "string",
  },
  resolve_time: {
    type: "string",
  },
  resolution: {
    type: "float64",
    nullable: true,
  },
  possibilities: {
    properties: {
      type: {
        // Enum["binary", "continuous"], via https://github.com/quantified-uncertainty/metaforecast/pull/84#discussion_r878240875
        // but metaculus might add new values in the future and we don't want the fetcher to break
        type: "string",
      },
    },
    additionalProperties: true,
  },
  prediction_count: {
    type: "uint32",
  },
  community_prediction: {
    properties: {
      full: {
        // q1/q2/q3 can be missing, e.g. https://www.metaculus.com/api2/questions/1633/
        optionalProperties: {
          q1: {
            type: "float64",
          },
          q2: {
            type: "float64",
          },
          q3: {
            type: "float64",
          },
        },
        additionalProperties: true,
      },
    },
    nullable: true,
    additionalProperties: true,
  },
} as const;

const pageProps = {
  page_url: {
    type: "string",
  },
  group: {
    type: "uint32",
    nullable: true,
  },
} as const;

// these are missing in /api2/questions/ requests, and building two schemas is too much pain
const optionalPageProps = {
  description: {
    type: "string",
  },
  description_html: {
    type: "string",
  },
} as const;

const questionSchema = {
  discriminator: "type",
  mapping: {
    forecast: {
      properties: {
        ...commonProps,
        ...pageProps,
        ...predictableProps,
      },
      optionalProperties: {
        ...optionalPageProps,
      },
      additionalProperties: true,
    },
    group: {
      properties: {
        ...commonProps,
        ...pageProps,
      },
      optionalProperties: {
        ...optionalPageProps,
        sub_questions: {
          elements: {
            properties: {
              ...commonProps,
              ...predictableProps,
            },
            additionalProperties: true,
          },
        },
      },
      additionalProperties: true,
    },
    // we're not interested in claims currently (but we should be?)
    claim: {
      properties: {
        ...commonProps,
        ...pageProps,
      },
      optionalProperties: {
        ...optionalPageProps,
      },
      additionalProperties: true,
    },
    discussion: {
      optionalProperties: {
        ...optionalPageProps,
      },
      additionalProperties: true,
    },
  },
} as const;

const knownQuestionTypes = Object.keys(questionSchema.mapping);

const shallowMultipleQuestionsSchema = {
  properties: {
    results: {
      elements: {
        properties: {
          type: {
            type: "string",
          },
        },
        additionalProperties: true,
      },
    },
    next: {
      type: "string",
      nullable: true,
    },
  },
  additionalProperties: true,
} as const;

export type ApiCommon = JTDDataType<{
  properties: typeof commonProps;
}>;
export type ApiPredictable = JTDDataType<{
  properties: typeof predictableProps;
}>;
export type ApiQuestion = JTDDataType<typeof questionSchema>;

type ApiShallowMultipleQuestions = JTDDataType<
  typeof shallowMultipleQuestionsSchema
>;

export type ApiMultipleQuestions = {
  results: ApiQuestion[];
  next: ApiShallowMultipleQuestions["next"]; // Omit<ApiShallowMultipleQuestions, "results"> doesn't work correctly here
};

const validateQuestion = new Ajv().compile<ApiQuestion>(questionSchema);
const validateShallowMultipleQuestions =
  new Ajv().compile<ApiShallowMultipleQuestions>(
    shallowMultipleQuestionsSchema
  );

async function fetchWithRetries<T = unknown>(url: string): Promise<T> {
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (error) {
    console.log(`Error while fetching ${url}`);
    console.log(error);
    if (axios.isAxiosError(error)) {
      if (error.response?.headers["retry-after"]) {
        const timeout = error.response.headers["retry-after"];
        console.log(`Timeout: ${timeout}`);
        await sleep(Number(timeout) * 1000 + 1000);
      } else {
        await sleep(RETRY_SLEEP_TIME);
      }
    }
  }
  const response = await axios.get<T>(url);
  return response.data;
}

const fetchAndValidate = async <T = unknown>(
  url: string,
  validator: ValidateFunction<T>
): Promise<T> => {
  // console.log(url);
  const data = await fetchWithRetries<object>(url);
  if (validator(data)) {
    return data;
  } else {
    console.log(data);
    throw new Error(
      `Response validation for url ${url} failed: ` +
        JSON.stringify(validator.errors, null, 4)
    );
  }
};

export async function fetchApiQuestions(
  next: string
): Promise<ApiMultipleQuestions> {
  const data = await fetchAndValidate(next, validateShallowMultipleQuestions);

  const isDefined = <T>(argument: T | undefined): argument is T => {
    return argument !== undefined;
  };

  return {
    ...data,
    results: data.results
      .map((result) => {
        if (!knownQuestionTypes.includes(result.type)) {
          console.warn(`Unknown result type ${result.type}, skipping`);
          return undefined;
        }

        if (!validateQuestion(result)) {
          //throw new Error(
          console.log(
            `Response validation failed: ` +
              JSON.stringify(validateQuestion.errors)
          );
          console.log("Failed result: ");
          console.log(result);
          return undefined;
        }
        return result;
      })
      .filter(isDefined),
  };
}

export async function fetchSingleApiQuestion(id: number): Promise<ApiQuestion> {
  return await fetchAndValidate(
    `https://www.metaculus.com/api2/questions/${id}/`,
    validateQuestion
  );
}
