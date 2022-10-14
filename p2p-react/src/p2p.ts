import { WebRTCTransport } from "js-libp2p-webrtc";
import { Components } from "@libp2p/components";
import { mockRegistrar, mockUpgrader } from "@libp2p/interface-mocks";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { multiaddr } from "@multiformats/multiaddr";
import { fromString as uint8arrayFromString } from "uint8arrays/from-string";
import { pipe } from "it-pipe";
import first from "it-first";
import { CreateListenerOptions, symbol } from "@libp2p/interface-transport";

function ignoredDialOption(): CreateListenerOptions {
  let u = mockUpgrader({});
  return {
    upgrader: u,
  };
}

export async function work() {
  let SERVER_MULTIADDR =
    "/ip4/172.29.128.142/udp/53177/webrtc/certhash/uEiCBPPP6sEawr6LzGrg9slRLww7UVBkb1P1-Od9JTS1CyQ/p2p/12D3KooWEmnkG1mJREw6Ep57iRSgC1mCwfJbvwLjRriGgGVH7oDV";

  console.log("Will test connecting to", SERVER_MULTIADDR);

  let t = new WebRTCTransport();
  let components = new Components({
    peerId: await createEd25519PeerId(),
    registrar: mockRegistrar(),
  });
  t.init(components);
  let ma = multiaddr(SERVER_MULTIADDR);
  console.log("dial");
  let conn = await t.dial(ma, ignoredDialOption());
  console.log("new stream");
  let stream = await conn.newStream(["/echo/1.0.0"]);
  let data = "dataToBeEchoedBackToMe\n";
  let response = await pipe(
    [uint8arrayFromString(data)],
    stream,
    async (source) => await first(source)
  );

  console.log({ response });
  return response;
}
