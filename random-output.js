module.exports = function (RED) {
  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    // Access the node's context object
    var context = this.context();
    // var flowContext = this.context().flow;
    // var context = this.context().global;
    //Elect a single node for 30 seconds.
    let electTime = 30;

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
      //Check if there is an elected node.
      isThereElectedNode = context.get("lastElectedNode");
      //If there is, check if it was elected more than 30s ago.
      let lastElectedTime = context.get("lastElectedTime");

      if (isThereElectedNode) {
        if (lastElectedTime) {
          let timeDiff = Date.now() - lastElectedTime;
          if (timeDiff > electTime * 1000) {
            let weightSum = node.weights.reduce((a, b) => a + b, 0);
            if (weightSum <= 0) {
              node.weights.fill(0, 1);
              weightSum = numberOfOutputs;
            }
            const randVal = Math.random() * weightSum;
            let weightAggregate = 0;
            let chosen;
            for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
              weightAggregate += node.weights[outputNum];
              if (randVal < weightAggregate) {
                //Elect this output.
                chosen = outputNum;
                context.set("lastElectedNode", outputNum);
                context.set("lastElectedTime", Date.now());
              }
            }
          }
        }
      } else {
        let weightSum = node.weights.reduce((a, b) => a + b, 0);
        if (weightSum <= 0) {
          node.weights.fill(0, 1);
          weightSum = numberOfOutputs;
        }
        const randVal = Math.random() * weightSum;
        let weightAggregate = 0;
        let chosen;
        for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
          weightAggregate += node.weights[outputNum];
          if (randVal < weightAggregate) {
            //Elect this output.
            chosen = outputNum;
            context.set("lastElectedNode", outputNum);
            context.set("lastElectedTime", Date.now());
          }
        }
      }
      output[chosen] = msg;
      node.send(output);
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
