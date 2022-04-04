module.exports = function (RED) {
  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context().global;
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
      if (context.get("lastElectedNode") && context.get("lastElectedNode") !== "") {
        //Check if lastElectedTime is less than 30s ago.
        //30s in unix time
        if (context.get("lastElectedTime"); > Date.getTime() - 30000) {
          chosen = context.get("lastElectedNode");
          output[chosen] = msg;
          node.send(output);
        } else {
          for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
            node.log(
              "node-red-contrib: There was node elected. Electing now."
            )
            weightAggregate += node.weights[outputNum];
            if (randVal < weightAggregate) {
              chosen = outputNum;
              context.set("lastElectedNode", outputNum);
              context.set("lastElectedTime", Date.now());

              node.log(
                "node-red-contrib: Elected node " +
                  context.get("lastElectedNode") +
                  " at " +
                  context.get("lastElectedTime")
              );

              break;
            }
          chosen = context.get("lastElectedNode");
          output[chosen] = msg;
          node.send(output);
          //Write message in node-red debug log.
          }
        }
      } else {
        for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
          weightAggregate += node.weights[outputNum];
          if (randVal < weightAggregate) {
            context.set("lastElectedNode", outputNum);
            context.set("lastElectedTime", Date.now());
            chosen = context.get("lastElectedNode");
            break;
          }
        }
        node.log(
          "node-red-contrib: No election was made. Using default else()."
        );
        output[chosen] = msg;
        node.send(output);
      }
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
