import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Input,
  Button,
  Box,
  Container,
  Heading,
  Select,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import type { Stream } from "@libp2p/interface-connection";
import {
  fromString as uint8arrayFromString,
  toString as uint8arrayToString,
} from "uint8arrays";
import { pipe } from "it-pipe";
import map from "it-map";
import { MdCall, MdScheduleSend } from "react-icons/md";
import ForceGraph3D, { GraphData } from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import {
  TextureLoader,
  SpriteMaterial,
  Sprite,
  LinearFilter,
  Group,
} from "three";

import { dial as dialWebRtc } from "./p2p";
import "./App.css";

type FormInputs = {
  goMultiAddr: string;
  message: string;
  dialSdk: string;
  peer: string;
};

type FormSubmitType = "dial" | "message";

type Peers = {
  id: string;
  multiAddr: string;
  stream: Stream;
};

function App() {
  // const [errMsg, setErrMsg] = useState("");
  // const [resultMsg, setResultMsg] = useState("");
  const [logger, setLogger] = useState<string[]>([]);
  const [_goMultiAddr, setGoMultiAddr] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [peers, setPeers] = useState<Map<string, Peers>>(new Map());
  const browserNode = {
    nodes: [{ id: "Browser", image: "./chrome.png" }],
    links: [],
  };
  const [data, setData] = useState<GraphData>(browserNode);
  const fgRef = useRef();
  const distance = 100;
  let stream: Stream;
  const sdks = [
    { label: "Go", value: "go" },
    { label: "Rust", value: "rust" },
  ];

  const truncate = (value: string, size: number = 20): string => {
    const half = Math.max(size, 1)/2;
  
    if (value.length > 20) {
      return value.substring(0, half) + '...' + value.substring(value.length - half);
    }

    return value;
  }

  // add a node to the graph
  const AddNode = async (id: string, sdk: string) => {
    await setData(({ nodes, links }) => {
      const data = {
        nodes: [{ id, image: `./${sdk}.png` }],
        links: [
          { source: id, curvature: 0.8, rotation: 0, target: "Browser" }, // line to the browser
          { source: "Browser", curvature: 0.8, rotation: 0, target: id }, // line from the browser
        ],
      };

      console.log("Adding node: ", data);

      return {
        nodes: [...nodes, ...data.nodes],
        links: [...links, ...data.links],
      };
    });
  };

  // rotate the camera for a cool effect
  useEffect(() => {
    (fgRef.current as any).cameraPosition({ z: distance });

    // camera orbit
    let angle = 0;
    setInterval(() => {
      (fgRef.current as any).cameraPosition({
        x: distance * Math.sin(angle),
        z: distance * Math.cos(angle),
      });
      angle += Math.PI / 300;
    }, 50);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    mode: "onBlur",
  });

  // handle all form submissions
  const onSubmit = async (values: FormInputs) => {
    const type: FormSubmitType = values.goMultiAddr !== "" ? "dial" : "message";

    switch (type) {
      case "dial":
        let id = await dial(values.goMultiAddr, values.dialSdk);
        setLogger(logger.concat(`Dialing ${values.dialSdk} peer ${truncate(id)}`));
        reset({ goMultiAddr: "", dialSdk: "" });
        break;
      case "message":
        setLogger(logger.concat(`Sending message "${values.message}" to ${truncate(values.peer)} peer`));
        await message(values.message, values.peer);
        reset({ message: "", peer: "" });
        break;
    }
  };

  // handle incoming and outgoing streams
  useEffect(() => {
    if (createMessage) console.log("createMessage", createMessage);
    if (peers) console.log("streams", peers);

    peers.forEach((peer, id) => {
      if (createMessage) {
        console.log("peer.stream.source", peer.stream.source);
        // log response to console
        pipe(
          peer.stream.source,
          (source) => map(source, (buf) => {
            console.log("source", source);
            console.log("buf", buf);
            return uint8arrayToString(buf.subarray());
          }),
          // Sink function
          async (source) => {
            // For each chunk of data
            for await (const msg of source) {
              // Output the data as a utf8 string     
              const parsed = msg.toString().replace("\n", "");  
              setLogger(logger.concat(`Received message "${parsed}" from peer ${truncate(peer.stream.id)}`));
              console.log("> " + parsed);
            }
          }
        );
  
        // send message to the listener
        pipe([uint8arrayFromString(createMessage)], peer.stream.sink);
      }
    })
  }, [createMessage, peers]);

  // connect to a peer
  const dial = async (goMultiAddr: string, sdk: string): Promise<string> => {
    await setGoMultiAddr(goMultiAddr);
    const stream = await dialWebRtc(goMultiAddr);
    await AddNode(stream.id, sdk);

    const peer: any = {
      id: stream.id,
      multiAddr: goMultiAddr,
      stream,
    }

    setPeers(peers.set(stream.id, peer));

    return stream.id;
  };

  // initiate sending a message to a peer
  const message = async (msg: string, peer: string) => {
    // show data movement on the graph
    // send from Browser to Peer first, the Peer to Browser
    data.links
      .filter(
        (link) =>
          (link.target as any).id === peer || (link.source as any).id === peer
      )
      .forEach((link) => {
        const delay =  (link.target as any).id === peer ? 0 : 300;
        setTimeout(() => (fgRef.current as any).emitParticle(link), delay);
      });

    setCreateMessage(msg + "\n");
  };

  // setInterval(() => {
  //   setLogger(logger.concat(`sdfafsdafdsafsdfasdafsd`));
  // }, 500);

  return (
    <div>
      <Container
        display="flex"
        alignItems="top"
        justifyContent="center"
        width="1400px"
      >
        <Box
          boxShadow="none"
          rounded="lg"
          padding={10}
          paddingBottom={0}
          background="white"
          width="1400px"
        >
          <Heading as="h1" size="md" textAlign="center" marginBottom={10}>
            LibP2P-WebRTC Demo
          </Heading>

          <form style={{ width: "1000px", marginLeft: "180px" }}>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <GridItem w="100%">
                <Input
                  {...register("goMultiAddr", { required: false })}
                  placeholder="Peer MultiAddress"
                  size="lg"
                />
              </GridItem>
              <GridItem w="100%">
                <Select
                  {...register("dialSdk", { required: false })}
                  placeholder="Client SDK"
                  size="lg"
                >
                  {sdks.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </GridItem>
              <GridItem w="100%">
                <Button
                  colorScheme="blue"
                  leftIcon={<MdCall />}
                  isLoading={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                  width={100}
                >
                  Dial
                </Button>
              </GridItem>
            </Grid>
            <Grid templateColumns="repeat(3, 1fr)" gap={6} marginTop={5}>
              <GridItem w="100%">
                <Input
                  {...register("message", { required: false })}
                  placeholder="Message"
                  size="lg"
                />
              </GridItem>
              <GridItem w="100%">
                <Select
                  {...register("peer", { required: false })}
                  placeholder="Peer"
                  size="lg"
                >
                  {Array.from(peers.values()).map((key, index) => (
                    <option key={index} value={key.id}>
                      {truncate(key.id)}
                    </option>
                  ))}
                </Select>
              </GridItem>
              <GridItem w="100%">
                <Button
                  colorScheme="blue"
                  leftIcon={<MdScheduleSend />}
                  isLoading={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                  width={100}
                >
                  Send
                </Button>
              </GridItem>
            </Grid>
          </form>

          {/* <div style={{marginTop: "20px"}}>Result: {resultMsg}</div> */}


          <Grid templateColumns="repeat(2, 1fr)" gap={0}>
            <GridItem w="100%">
              <ForceGraph3D
                ref={fgRef}
                // enableNodeDrag={false}
                // enableNavigationControls={false}
                showNavInfo={false}
                graphData={data}
                width={600}
                height={400}
                // onEngineStop={() => (fgRef.current as any).zoomToFit(1800)}
                backgroundColor={"#fff"}
                nodeColor={() => "#000"}
                // nodeRelSize={4}
                linkColor={() => "#000"}
                linkOpacity={1}
                linkWidth={0.1}
                linkCurvature="curvature"
                linkCurveRotation="rotation"
                // linkDirectionalParticles={2}
                linkDirectionalParticleWidth={1}
                linkDirectionalParticleColor={() => "red"}
                linkDirectionalParticleSpeed={0.1}
                onLinkClick={(link) => console.log("link", link)}
                nodeThreeObject={(node: any) => {
                  // text sprite
                  const spriteText = new SpriteText(node.id);
                  spriteText.color = node.color;
                  spriteText.textHeight = 3;

                  // image sprite
                  var map = new TextureLoader().load(node.image);
                  map.minFilter = LinearFilter;
                  const material = new SpriteMaterial({ map: map });
                  const spriteImg = new Sprite(material);
                  spriteImg.scale.set(9, 9, 1);

                  // combine the sprites as a group
                  var group = new Group();
                  // group.add( spriteText );
                  group.add(spriteImg);

                  return group;
                }}
              />

            </GridItem>
            <GridItem w="100%">
                <div style={{ padding: "10px", width: "100%", height: "300px", background: "black", marginTop: "40px", overflowY: "scroll", color: "white"}}>
                  {logger.map((log, index) => (
                    <div>{log}</div>
                  ))}
                </div>
            </GridItem>
          </Grid>


        </Box>
      </Container>
    </div>
  );
}

export default App;
