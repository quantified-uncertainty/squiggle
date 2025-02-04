import axios from "axios";

let elicitEndpoint =
  "https://elicit.org/api/v1/binary-questions/csv?binaryQuestions.resolved=false&binaryQuestions.search=&binaryQuestions.sortBy=popularity&predictors=community";

let main = async () => {
  let response = await axios.get(elicitEndpoint).then((query) => query.data);

  console.log(response);
};
main();
