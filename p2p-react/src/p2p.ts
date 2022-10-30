import { webRTC } from "js-libp2p-webrtc";
import type { Stream } from "@libp2p/interface-connection";
import { multiaddr } from "@multiformats/multiaddr";
import {
  fromString as uint8arrayFromString,
  toString as uint8arrayToString,
} from "uint8arrays";
import { pipe } from "it-pipe";
import first from "it-first";
import { Noise } from "@chainsafe/libp2p-noise";
import { createLibp2p } from "libp2p";

export async function dial(
  multiaddress: string /*, cb: any*/
): Promise<Stream> {
  console.log("Will test connecting to", multiaddress);

  const node = await createLibp2p({
    transports: [webRTC()],
    connectionEncryption: [() => new Noise()],
  });

  await node.start();

  const ma = multiaddr(multiaddress);
  console.log("dial echo for", multiaddress);

  return node.dialProtocol(ma, ["/echo/1.0.0"]);
}

export async function message(stream: Stream, msg: string) {
  let message = "";

  const response = await pipe(
    [uint8arrayFromString(msg)],
    stream,
    async (source) => await first(source)
  );

  if (response) {
    message = uint8arrayToString(response.slice(0, response.length));
    console.log(`Received message: '${message}'`);
  }

  return message;
}
