export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
};

export type CreateDashboardInput = {
  /** The creator of the dashboard, e.g. "Peter Parker" */
  creator?: InputMaybe<Scalars['String']['input']>;
  /** The longer description of the dashboard */
  description?: InputMaybe<Scalars['String']['input']>;
  /** List of question ids */
  ids: Array<Scalars['ID']['input']>;
  /** The title of the dashboard */
  title: Scalars['String']['input'];
};

export type CreateDashboardResult = {
  __typename?: 'CreateDashboardResult';
  dashboard: Dashboard;
};

export type Dashboard = {
  __typename?: 'Dashboard';
  /** The creator of the dashboard, e.g. "Peter Parker" */
  creator: Scalars['String']['output'];
  /** The longer description of the dashboard */
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** The list of questions on the dashboard */
  questions: Array<Question>;
  /** The title of the dashboard */
  title: Scalars['String']['output'];
};

export type History = QuestionShape & {
  __typename?: 'History';
  description: Scalars['String']['output'];
  /** Last timestamp at which metaforecast fetched the question */
  fetched: Scalars['Date']['output'];
  /** Last timestamp at which metaforecast fetched the question, in ISO 8601 format */
  fetchedStr: Scalars['String']['output'];
  /** History items are identified by their integer ids */
  id: Scalars['ID']['output'];
  options: Array<ProbabilityOption>;
  platform: Platform;
  qualityIndicators: QualityIndicators;
  /** Unique string which identifies the question */
  questionId: Scalars['ID']['output'];
  /**
   * Last timestamp at which metaforecast fetched the question
   * @deprecated Renamed to `fetched`
   */
  timestamp: Scalars['Date']['output'];
  title: Scalars['String']['output'];
  /** Non-unique, a very small number of platforms have a page for more than one prediction */
  url: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new dashboard; if the dashboard with given ids already exists then it will be returned instead. */
  createDashboard: CreateDashboardResult;
};


export type MutationCreateDashboardArgs = {
  input: CreateDashboardInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** Forecasting platform supported by Metaforecast */
export type Platform = {
  __typename?: 'Platform';
  /** Short unique platform name, e.g. "xrisk" */
  id: Scalars['ID']['output'];
  /** Platform name for displaying on frontend etc., e.g. "X-risk estimates" */
  label: Scalars['String']['output'];
  lastUpdated?: Maybe<Scalars['Date']['output']>;
};

export type ProbabilityOption = {
  __typename?: 'ProbabilityOption';
  name?: Maybe<Scalars['String']['output']>;
  /** 0 to 1 */
  probability?: Maybe<Scalars['Float']['output']>;
};

/** Various indicators of the question's quality */
export type QualityIndicators = {
  __typename?: 'QualityIndicators';
  liquidity?: Maybe<Scalars['Float']['output']>;
  numForecasters?: Maybe<Scalars['Int']['output']>;
  numForecasts?: Maybe<Scalars['Int']['output']>;
  openInterest?: Maybe<Scalars['Float']['output']>;
  sharesVolume?: Maybe<Scalars['Float']['output']>;
  spread?: Maybe<Scalars['Float']['output']>;
  /** 0 to 5 */
  stars: Scalars['Int']['output'];
  tradeVolume?: Maybe<Scalars['Float']['output']>;
  volume?: Maybe<Scalars['Float']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** Look up a single dashboard by its id */
  dashboard?: Maybe<Dashboard>;
  /** Get a list of questions that are currently on the frontpage */
  frontpage: Array<Question>;
  platforms: Array<Platform>;
  /** Look up a single question by its id */
  question?: Maybe<Question>;
  questions: QueryQuestionsConnection;
  /** Search for questions; uses Elasticsearch instead of the primary metaforecast database */
  searchQuestions: Array<Question>;
};


export type QueryDashboardArgs = {
  id: Scalars['ID']['input'];
};


export type QueryQuestionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryQuestionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QuestionsOrderBy>;
};


export type QuerySearchQuestionsArgs = {
  input: SearchInput;
};

export type QueryQuestionsConnection = {
  __typename?: 'QueryQuestionsConnection';
  edges: Array<QueryQuestionsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryQuestionsConnectionEdge = {
  __typename?: 'QueryQuestionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Question;
};

export type Question = QuestionShape & {
  __typename?: 'Question';
  description: Scalars['String']['output'];
  /** Last timestamp at which metaforecast fetched the question */
  fetched: Scalars['Date']['output'];
  /** Last timestamp at which metaforecast fetched the question, in ISO 8601 format */
  fetchedStr: Scalars['String']['output'];
  /** First timestamp at which metaforecast fetched the question */
  firstSeen: Scalars['Date']['output'];
  /** First timestamp at which metaforecast fetched the question, in ISO 8601 format */
  firstSeenStr: Scalars['String']['output'];
  history: Array<History>;
  /** Unique string which identifies the question */
  id: Scalars['ID']['output'];
  options: Array<ProbabilityOption>;
  platform: Platform;
  qualityIndicators: QualityIndicators;
  /**
   * Last timestamp at which metaforecast fetched the question
   * @deprecated Renamed to `fetched`
   */
  timestamp: Scalars['Date']['output'];
  title: Scalars['String']['output'];
  /** Non-unique, a very small number of platforms have a page for more than one prediction */
  url: Scalars['String']['output'];
  visualization?: Maybe<Scalars['String']['output']>;
};

export type QuestionShape = {
  description: Scalars['String']['output'];
  /** Last timestamp at which metaforecast fetched the question */
  fetched: Scalars['Date']['output'];
  /** Last timestamp at which metaforecast fetched the question, in ISO 8601 format */
  fetchedStr: Scalars['String']['output'];
  options: Array<ProbabilityOption>;
  platform: Platform;
  qualityIndicators: QualityIndicators;
  /**
   * Last timestamp at which metaforecast fetched the question
   * @deprecated Renamed to `fetched`
   */
  timestamp: Scalars['Date']['output'];
  title: Scalars['String']['output'];
  /** Non-unique, a very small number of platforms have a page for more than one prediction */
  url: Scalars['String']['output'];
};

export enum QuestionsOrderBy {
  FirstSeenDesc = 'FIRST_SEEN_DESC'
}

export type SearchInput = {
  /** List of platform ids to filter by */
  forecastingPlatforms?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Minimum number of forecasts on a question */
  forecastsThreshold?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  /** Minimum number of stars on a question */
  starsThreshold?: InputMaybe<Scalars['Int']['input']>;
};
