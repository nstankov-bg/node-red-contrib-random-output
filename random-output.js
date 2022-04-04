module.exports = function (RED) {
  function electOutput(i, context){
    context.set('CurrentOutput', i);
    context.set('CurrentOutputElectionTimestamp', Date.now());
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();
    const numberOfOutputs = config.outputs;

    node.on("input", function (msg) {
      let output = new Array(numberOfOutputs);
      node.log(
        "Generating " + numberOfOutputs + " random outputs for node " + node.id
      );
      //Get a single random number from output range
      for (let i = 0; i < numberOfOutputs; i++) {
        output[i] = Math.floor(Math.random() * numberOfOutputs);
      }
      //Sort the output array
      output.sort();
      //Set the output
      electOutput(output[0], context);
      node.log("Output: " + output[0]);
      
      output[context.get("CurrentOutput")] = msg;
      node.send(output);
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
