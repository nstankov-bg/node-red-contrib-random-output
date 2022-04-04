function checkIfNodeIsElected(context, node, outputNum) {
  if (context.get("lastElectedNode") === outputNum) {
    return true;
  } else {
    return false;
  }
}

function checkReElectionEligibility(context, node, outputNum) {}

function electNode(enabled, context, node, outputNum) {
  if (enabled) {
    context.set("lastElectedNode", outputNum);
    context.set("lastElectedTime", Date.now());
    //2m minutes to expire
    context.set(
      "lastElectedTimeNode" + context.get("lastElectedNode"),
      Date.now() + 120000
    );

    node.log(
      "node-red-contrib: Elected node " +
        context.get("lastElectedNode") +
        " at " +
        context.get("lastElectedTime")
    );
  }
}

module.exports = function (RED) {
  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();

    // context.get("lastElectedNode")
    // context.get("lastElectedTime")

    node.weights = [];
    for (let weight of config.weights) {
      weight = Number(weight);
      if (isNaN(weight) || weight < 0) {
        weight = 1;
      }
      node.weights.push(weight);
    }

    const numberOfOutputs = config.outputs;
    node.weights = config.useWeights
      ? node.weights.slice(0, numberOfOutputs)
      : Array(numberOfOutputs).fill(1);

    node.on("input", function (msg) {
      let output = new Array(numberOfOutputs);

      let weightSum = node.weights.reduce((a, b) => a + b, 0);
      if (weightSum <= 0) {
        node.weights.fill(0, 1);
        weightSum = numberOfOutputs;
      }

      const randVal = Math.random() * weightSum;
      let weightAggregate = 0;
      let chosen;
      if (context.get("lastElectedNode") !== "") {
        if (context.get("lastElectedTime") > Date.now() - 30000) {
          output[chosen] = msg;
          node.send(output);
        } else {
          for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
            weightAggregate += node.weights[outputNum];
            if (randVal < weightAggregate) {
              chosen = outputNum;
              electNode(true, context, node, outputNum);
              break;
            }
            chosen = context.get("lastElectedNode");
            output[chosen] = msg;
            node.send(output);
          }
        }
      }
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
