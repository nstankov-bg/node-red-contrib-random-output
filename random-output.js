module.exports = function (RED) {
  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    const numberOfOutputs = config.outputs;

    node.on("input", function (msg) {
      let output = new Array(numberOfOutputs);
      node.log(
        "Generating " + numberOfOutputs + " random outputs for node " + node.id
      );
      for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
        chosen = outputNum;
        output[chosen] = msg;
        node.send(output);
      }
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
