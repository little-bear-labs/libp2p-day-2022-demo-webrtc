import { webRTC } from "js-libp2p-webrtc";
import { Components } from "@libp2p/components";
import { mockRegistrar, mockUpgrader } from "@libp2p/interface-mocks";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { multiaddr } from "@multiformats/multiaddr";
import { fromString as uint8arrayFromString } from "uint8arrays/from-string";
import { pipe } from "it-pipe";
import first from "it-first";
import { CreateListenerOptions, symbol } from "@libp2p/interface-transport";
import { Noise } from "@chainsafe/libp2p-noise";
import { createLibp2p } from "libp2p";

function ignoredDialOption(): CreateListenerOptions {
  let u = mockUpgrader({});
  return {
    upgrader: u,
  };
}

export async function work() {
  let SERVER_MULTIADDR =
    "/ip4/172.29.128.142/udp/49340/webrtc/certhash/uEiC5ORhN5Axxl0CCuCPV8G2Sx_2z5vnJRPgua4iJmx7TnQ/p2p/12D3KooWSK7wGyeRQvZURNDZQKWfnogQ3k7dyr7pr9UjUpJV7XcM";

  console.log("Will test connecting to", SERVER_MULTIADDR);

  const node = await createLibp2p({
    transports: [webRTC()],
    connectionEncryption: [() => new Noise()],
  });
  await node.start();
  // let components = new Components({
  //   peerId: await createEd25519PeerId(),
  //   registrar: mockRegistrar(),
  // });
  // t.init(components);
  let ma = multiaddr(SERVER_MULTIADDR);
  console.log("dial");
  const stream = await node.dialProtocol(ma, ["/echo/1.0.0"]);
  let data = "dataToBeEchoedBackToMe\n";
  let response = await pipe(
    [uint8arrayFromString(data)],
    stream,
    async (source) => await first(source)
  );

  console.log({ response });
  return response;
}
