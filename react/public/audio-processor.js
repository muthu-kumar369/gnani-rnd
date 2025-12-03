// /react/public/audio-processor.js
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0 && input[0].length > 0) {
      // Send the first channel's audio data back to the main thread.
      // The data is sent as a Float32Array.
      this.port.postMessage({
        type: 'audioBuffer',
        audioBuffer: input[0],
      });
    }

    // Pass audio through to the output, if needed for local playback.
    const output = outputs[0];
    for (let channel = 0; channel < input.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);