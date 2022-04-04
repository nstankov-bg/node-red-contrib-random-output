module.exports = function (RED) {
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
    return true;
  }
  function checkReelectionEligibility(context, outputNum, node) {
    context.get("lastElectedTimeNode" + outputNum);
    //check if the node is eligible for re-election
    if (context.get("lastElectedTimeNode" + outputNum) > Date.now()) {
      node.log( "node-red-contrib: Node " + outputNum + " is eligible for re-election");
      return false;
    } else {
      node.log( "node-red-contrib: Node " + outputNum + " is not eligible for re-election");
      return true;
    }
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();

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
        chosen = context.get("lastElectedNode");
        if (checkReelectionEligibility(context, chosen, node)) {
          electNode(true, context, node, chosen);
        }
        if (context.get("lastElectedTime") > Date.now() - 30000) {
          chosen = context.get("lastElectedNode");
          output[chosen] = msg;
          node.send(output);
        } else {
          for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
            weightAggregate += node.weights[outputNum];
            if (randVal < weightAggregate) {
              chosen = outputNum;
              electNode(true, context, node, outputNum);
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
