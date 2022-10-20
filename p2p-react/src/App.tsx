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

function App() {
  // const [errMsg, setErrMsg] = useState("");
  // const [resultMsg, setResultMsg] = useState("");
  const [_goMultiAddr, setGoMultiAddr] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [streams, setStreams] = useState<Stream>();
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

  // add a node to the graph
  const AddNode = async (id: string) => {
    await setData(({ nodes, links }) => {
      const data = {
        nodes: [{ id, image: `./${id}.png` }],
        links: [
          { source: id, curvature: 0.8, rotation: 0, target: "Browser" }, // line to the browser
          { source: "Browser", curvature: 0.8, rotation: 0, target: id }, // line from the browser
        ],
      };

      console.log("Add Node: ", data);

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
    }, 100);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    mode: "onBlur",
  });

  const onSubmit = async (values: FormInputs) => {
    const type: FormSubmitType = values.goMultiAddr !== "" ? "dial" : "message";
    console.log("onSubmit type", type);

    switch (type) {
      case "dial":
        dial(values.goMultiAddr, values.dialSdk);
        reset({ goMultiAddr: "", dialSdk: "" });
        break;
      case "message":
        await message(values.message, values.peer);
        reset({ message: "", peer: "" });
        break;
    }
  };

  useEffect(() => {
    if (createMessage) console.log("createMessage", createMessage);
    if (streams) console.log("streams", streams);
    if (createMessage && streams) {
      // log response to console
      pipe(
        streams.source,
        (source) => map(source, (buf) => uint8arrayToString(buf.subarray())),
        // Sink function
        async (source) => {
          // For each chunk of data
          for await (const msg of source) {
            // Output the data as a utf8 string
            console.log("> " + msg.toString().replace("\n", ""));
          }
        }
      );

      // send message to the listener
      pipe([uint8arrayFromString(createMessage)], streams.sink);
    }
  }, [createMessage, streams]);

  const dial = async (goMultiAddr: string, sdk: string) => {
    await setGoMultiAddr(goMultiAddr);
    await AddNode(sdk);
    stream = await dialWebRtc(goMultiAddr);

    setStreams(stream);
  };

  const message = async (msg: string, peer: string) => {
    data.links
      .filter(
        (link) =>
          (link.target as any).id === peer || (link.source as any).id === peer
      )
      .forEach((link) => (fgRef.current as any).emitParticle(link));

    setCreateMessage(msg + "\n");
  };

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
                  placeholder="Go Client MultiAddress"
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
                  leftIcon={<MdScheduleSend />}
                  isLoading={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                >
                  Send
                </Button>
              </GridItem>
            </Grid>
          </form>

          {/* <div style={{marginTop: "20px"}}>Result: {resultMsg}</div> */}

          <ForceGraph3D
            ref={fgRef}
            // enableNodeDrag={false}
            // enableNavigationControls={false}
            showNavInfo={false}
            graphData={data}
            width={800}
            height={500}
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
        </Box>
      </Container>
    </div>
  );
}

export default App;
