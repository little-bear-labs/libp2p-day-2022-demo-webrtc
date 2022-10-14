import { WebRTCTransport } from "js-libp2p-webrtc";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { Components } from "@libp2p/components";
import { mockRegistrar, mockUpgrader } from "@libp2p/interface-mocks";
import { fromString as uint8arrayFromString } from "uint8arrays/from-string";
import { multiaddr, Multiaddr } from "@multiformats/multiaddr";
import { CreateListenerOptions, symbol } from "@libp2p/interface-transport";
import { pipe } from "it-pipe";
import first from "it-first";

function ignoredDialOption(): CreateListenerOptions {
  let u = mockUpgrader({});
  return {
    upgrader: u,
  };
}

describe("basic test", () => {
  it("run the test", async () => {
    let SERVER_MULTIADDR =
      "/ip4/172.29.128.142/udp/64121/webrtc/certhash/uEiCjQ3QGg6VTv4MZN9-z8dIyIIV26fa1uwcBG2t2FDfuSg/p2p/12D3KooWGHtxr5fJKDkYQK2LT7PJSkYKEPohgEW8Btft4u8bHwyC";

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
    console.log("wait for resp");
    let response = await pipe(
      [uint8arrayFromString(data)],
      stream,
      async (source) => await first(source)
    );

    console.log({ response });
  });
});
