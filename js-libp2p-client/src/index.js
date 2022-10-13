import { WebRTCTransport } from "js-libp2p-webrtc";

let SERVER_MULTIADDR =
  "/ip4/172.29.128.142/udp/64121/webrtc/certhash/uEiCjQ3QGg6VTv4MZN9-z8dIyIIV26fa1uwcBG2t2FDfuSg/p2p/12D3KooWGHtxr5fJKDkYQK2LT7PJSkYKEPohgEW8Btft4u8bHwyC";

console.log("Will test connecting to", SERVER_MULTIADDR);

let t = new WebRTCTransport();

// let t = new underTest.WebRTCTransport();
// let components = new Components({
//   peerId: await createEd25519PeerId(),
//   registrar: mockRegistrar(),
// });
// t.init(components);
// let ma = new Multiaddr(SERVER_MULTIADDR);
// let conn = await t.dial(ma, ignoredDialOption());
// let stream = await conn.newStream(["/echo/1.0.0"]);
// let data = "dataToBeEchoedBackToMe\n";
// let response = await pipe(
//   [uint8arrayFromString(data)],
//   stream,
//   async (source) => await first(source)
// );

// console.log({ response });
