const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const dfff = require("dialogflow-fulfillment");
const app = express();
var axios = require("axios");
const { provideCore } = require("@yext/answers-core");

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server Is Working......");
});
const core = provideCore({
  apiKey: "yourPrivateKey",
  experienceKey: "yourExperienceKey",
  locale: "en",
  experienceVersion: "STAGING",
  endpoints: {
    universalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/query",
    verticalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/query",
    questionSubmission:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion",
    status: "https://answersstatus.pagescdn.com",
    universalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/autocomplete",
    verticalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/autocomplete",
    filterSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/filtersearch",
  },
});
/**
 * on this route dialogflow send the webhook request
 * For the dialogflow we need POST Route.
 * */
app.post("/webhook", (req, res) => {
  var query = req.body.queryResult.queryText;
  console.log(query);
  // get agent from request
  const agent = new WebhookClient({ request: req, response: res });
  // create intentMap for handle intent
  const intentMap = new Map();
  const options = { sendAsMessage: true, rawPayload: true };
  // add intent map 2nd parameter pass function
  intentMap.set("webhook-demo", handleFaqIntent);
  intentMap.set("faq529ContactIntent", handleFaq529ContactIntent);
  intentMap.set("faq529Intent", handleFaq529Intent);
  intentMap.set("productIntent", handleProductIntent);
  intentMap.set("materialIntent", handleMaterialIntent);
  intentMap.set("stockInfo", getStockPrice);
  intentMap.set("Default Fallback Intent", handleFallback);

  agent.handleRequest(intentMap);

  async function handleFaq529ContactIntent(agent) {
    const res = await retData(await query);
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function handleProductIntent(agent) {
    query = "college savings plan please";
    const res = await retData(await query);
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function handleFallback(agent) {
    console.log(query);
    const res = await retData(await query);
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function handleMaterialIntent(agent) {
    query = "Is there sales material on 529 plans?";
    const res = await retData(await query);
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function handleFaq529Intent(agent) {
    const res = await retData(await query);
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  function getStockPrice(agent) {
    var config = {
      method: "get",
      url:
        "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=demo",
      headers: {},
    };
    return axios(config)
      .then(function (response) {
        agent.add(
          `Microsoft is currently ticking at $ ${
            response.data["Global Quote"]["05. price"].split(".")[0]
          }`
        );
      })
      .catch(function (error) {
        agent.add(error);
      });
  }

  async function handleFaqIntent(agent) {
    const res = await retData(await query);
    agent.add(res);
  }

  async function retData(queryString) {
    try {
      const result = await core.universalSearch({
        query: queryString,
      });
      // console.log(JSON.stringify(results));
      var answerJson;
      result.verticalResults.forEach((item) => {
        if (item.results[0].rawData.type == "faq") {
          console.log("yes");
          answerJson = item.results[0].rawData;
        }
      });
      console.log(JSON.stringify(answerJson));
      var answerText = answerJson.description
        ? answerJson.description
        : answerJson.answer;
      var richResult = {
        richContent: [[]],
      };
      if (answerJson.c_photo) {
        var img = {
          type: "image",
          rawUrl: answerJson.c_photo.url,
          accessibilityText: "Dialogflow across platforms",
        };
        richResult.richContent[0].push(img);
      }
      if (answerText) {
        var ansr = {
          type: "info",
          subtitle: answerText,
        };
        richResult.richContent[0].push(ansr);
      }
      if (answerJson.c_primaryCTA) {
        var chips = {
          type: "chips",
          options: [
            {
              text: answerJson.c_primaryCTA.label,
              link: answerJson.c_primaryCTA.link,
            },
          ],
        };
        if (answerJson.c_secondaryCTA) {
          var options2 = {
            text: answerJson.c_secondaryCTA.label,
            link: answerJson.c_secondaryCTA.link,
          };
          chips.options.push(options2);
        }
        if (answerJson.tertiaryCTA) {
          var options3 = {
            text: answerJson.tertiaryCTA.label,
            link: answerJson.tertiaryCTA.link,
          };
          chips.options.push(options3);
        }
        richResult.richContent[0].push(chips);
      }
      return richResult;
    } catch (err) {
      return err;
    }
  }
});
/**
 * now listing the server on port number 3000 :)
 * */
app.listen(3000, () => {
  console.log("Server is Running on port 3000");
});
