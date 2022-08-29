import React, { useEffect, useState } from "react";
import {
  INodeStatus,
  IAccount,
  IProvider,
  ProviderType,
  IClientConfig,
  Client,
  IEventFilter,
  EventPoller,
  IEvent,
  IContractStorageData,
  IContractReadOperationData,
  IReadData,
  IOperationData,
  IBlockInfo,
  EOperationStatus,
} from "@massalabs/massa-web3";
import { v4 as uuidv4 } from 'uuid';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import logo from '../images/dcm-logo-short.svg';
import AddArticle from "./AddArticle";
//import ListOfArticles from "./ListOfArticles";
import ListOfArticlesSC from "./ListOfArticlesSC";

const baseAccount = {
  privateKey: "4tBnKAsQz1TTKaLdqSGBrh7v6dfi3gWuGbEwPb85LCDpPMUmH",
  publicKey: "dWoC3GktwpePEESscvnu9S7qRqVLqshoJvSyVcqqC6WyS7dda",
  address: "A1EBTWz5xsxZfVJpDYSQ8cW627WXAXWouZGQFM4b3Bt8w8oD13u"
} as IAccount;

type TNodeStatus = INodeStatus | null;

type TClient = Client;

const providers: Array<IProvider> = [
  {
    url: "https://experiment.massa.net/api/v2",
    //url: "http://127.0.0.1:33035",
    type: ProviderType.PUBLIC
  } as IProvider,
  {
    url: "https://experiment.massa.net/api/v2",
    //url: "http://127.0.0.1:33034",
    type: ProviderType.PRIVATE
  } as IProvider
];

const web3ClientConfig = {
  providers,
  retryStrategyOn: true,// activate the backoff retry strategy
  periodOffset: 3       // set an offset of a few periods (default = 5)
} as IClientConfig;

let web3Client: TClient;

let sc_addr = "A1EBTWz5xsxZfVJpDYSQ8cW627WXAXWouZGQFM4b3Bt8w8oD13u";
let interval: string | number | NodeJS.Timer | undefined;
let title = "";

const App = () => {

  const [data, setData] = useState({
    id: "",
    Classification: "article",
    imageUrl: "",
    title: "",
    locale: "en",
    body: "",
  });
  const [articleData, setArticleData] = useState({
    id: "",
    Classification: "article",
    imageUrl: "",
    title: "",
    locale: "en",
    body: "",
  });
  const [open, setOpen] = useState<boolean>(false);
  const [openArticle, setOpenArticle] = useState<boolean>(false);
  const [openInfo, setOpenInfo] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isEvent, setEvent] = useState<boolean>(false);
  const [datainfo, setDataInfo] = useState<{ key: string; operationId: string[]; title: string; imageUrl: string; }[]>([]);
  const [datainfoSC, setDataInfoSC] = useState<{ key: string; imageUrl: string; title: string }[]>([]);
  const [nodeStatus, setNodeStatus] = useState<TNodeStatus>(null);
  const [progress, setProgress] = useState<number>(0);
  const [menuNumber, setMenuNumber] = useState<number>(0);

  useEffect(() => {
    if (baseAccount.address && baseAccount.privateKey && baseAccount.publicKey) {
      web3Client = new Client(web3ClientConfig, baseAccount);
      getNodeStatusAsync();
      subscribeEvent("no key");
    } else {
      setMessage(!baseAccount.address ? 'Please, set address to baseAccount' : !baseAccount.privateKey ? 'Please, set PrivatKey to baseAccount' : 'Please, set PublicKey to baseAccount');
      setOpen(true);
    }
  }, []);

  const handleCloseInfo = () => {
    setOpenInfo(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseArticle = () => {
    setOpenArticle(false);
  };

  useEffect(() => {
    console.log("Massa Net Version: " + nodeStatus?.version);
    console.log("Massa Net Node Id: " + nodeStatus?.node_ip);
    console.log("Massa Net Time: " + nodeStatus?.current_time);
    console.log("Massa Net Cycle: " + nodeStatus?.current_cycle);
  }, [nodeStatus]);

  const setDataToSC = async (value: any) => {
    setLoading(true);
    let key = uuidv4();
    let accumulated;
    let modulo;
    const datavalue = { ...value, id: key };

    let chunks = JSON.stringify(datavalue || "").match(/.{900}/g);

    if (chunks === null) {
      chunks = [JSON.stringify(datavalue || "")]
    } else {
      accumulated = chunks.length * 900;
      modulo = JSON.stringify(datavalue || "").length % accumulated;

      if (modulo) chunks.push(JSON.stringify(datavalue || "").slice(accumulated));
    }

    const callSetData = await web3Client.smartContracts().callSmartContract({
      fee: 0,
      maxGas: 100000,
      gasPrice: 0,
      parallelCoins: 0,
      sequentialCoins: 0,
      targetAddress: sc_addr,
      functionName: "setData",
      parameter: sc_addr + "|" + key + "|" + chunks[0] + "|" + datavalue.imageUrl + "|" + datavalue.title
    });

    setProgress(10);

    const status = await web3Client.smartContracts().awaitRequiredOperationStatus(callSetData[0], EOperationStatus.FINAL);
    console.log(status);

    setDataInfo(prevDataInfo => [
      ...prevDataInfo, { key: key.toString(), operationId: callSetData, title: title || "", imageUrl: value.imageUrl }
    ]);
    if (chunks.length > 1) {
      appendDataToSC(chunks, key);
    } else {
      setProgress(40);
      interval = setInterval(() => {
        subscribeEvent(key);
      }, 3000);
    }
  }

  const timer = (ms: number) => {
    return new Promise(res => setTimeout(res, ms))
  }

  const appendDataToSC = async (pieces: any, key: string) => {
    for (let i = 1; i < pieces.length; i++) {
      const callAppend = await web3Client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 100000,
        gasPrice: 0,
        parallelCoins: 0,
        sequentialCoins: 0,
        targetAddress: sc_addr,
        functionName: "appendData",
        parameter: sc_addr + "|" + key + "|" + JSON.stringify(pieces[i])
      });

      const status = await web3Client.smartContracts().awaitRequiredOperationStatus(callAppend[0], EOperationStatus.FINAL);
      console.log(status);
      setProgress((prevProgress) => (i * 100 / pieces.length));

      if (i === pieces.length - 1) {
        interval = setInterval(() => {
          subscribeEvent(key);
        }, 3000);
      }
    }
  }

  const getOperation = async (txid: string[]) => {
    try {
      const operations: Array<IOperationData> = await web3Client.publicApi().getOperations(txid);
      console.log('Operation ->', operations);
    } catch (err) {
      console.error('Operation ->', err);
    }
    setTimeout(async () => {
      try {
        const operations: Array<IOperationData> = await web3Client.publicApi().getOperations(txid);
        // get block info
        const blocks: Array<IBlockInfo> = await web3Client
          .publicApi()
          .getBlocks(operations[0].in_blocks);
        console.log('Blocks ->', blocks);
      } catch (err) {
        console.error('Blocks ->', err);
      }
    }, 3000)
  }

  const readData = async (key: string) => {
    console.log(sc_addr);
    const data: Array<IContractReadOperationData> = await web3Client.smartContracts().readSmartContract({
      fee: 0,
      maxGas: 100000,
      simulatedGasPrice: 0,
      targetAddress: sc_addr,
      targetFunction: "readData",
      parameter: sc_addr + "|" + sc_addr,
      callerAddress: baseAccount.address
    } as IReadData);

    if (data[0].result === "Ok") {
      console.log(data);
      console.log(data[0].output_events[0].data);
    } else {
      console.log(data)
    }
  }

  const getData = async (key: string) => {
    try {
      const data: IContractStorageData | null = await web3Client.publicApi().getDatastoreEntry(sc_addr, key);
      //NOTE: Part of the string include brackets, which added by append data (like - string"append-string")
      //it's not allowed to use JSON.parse, this issue was fixed by list of replaces.
      let datastring = data.final?.replace(/,"title":/g, "||").replace(/"id":/g, "").replace(/,"Classification":/g, "||").replace(/,"imageUrl":/g, "||").replace(/,"locale":/g, "||").replace(/,"body":/g, "||").replace(/"/g, "");

      const articleD: any = datastring?.split("||");
      if (articleD.length) {
        setArticleData({
          id: articleD.id,
          Classification: articleD[1].toString(),
          imageUrl: articleD[2].toString(),
          title: articleD[3].toString(),
          locale: articleD[4].toString(),
          body: articleD[5].toString()
        });
      }
      setOpenArticle(true);
    } catch (err) {
      console.error('Data ->', err);
    }
  }

  const getListArticles = async () => {
    try {
      const data: IContractStorageData | null = await web3Client.publicApi().getDatastoreEntry(sc_addr, "ListOfArticles");
      if (data.final) {
        let numberArticles = data.final.split("||");
        numberArticles.pop();
        let dataArray: { key: string; imageUrl: string; title: string; }[] = [];
        numberArticles.forEach((item) => {
          dataArray.push({
            key: item.split("|")[0],
            imageUrl: item.split("|")[1],
            title: item.split("|")[2],
          })
        });
        console.log(dataArray);
        setDataInfoSC(dataArray);
      }
    } catch (err) {
      console.error('Data ->', err);
    }
  } 

  const subscribeEvent = async (key: string) => {
    if (!sc_addr) {
      setMessage("Invalid params: address par error.");
      setOpen(true);
      return
    }
    const eventsFilter = {
      start: null,
      end: null,
      original_caller_address: sc_addr,
      original_operation_id: null,
      emitter_address: null,
    } as IEventFilter;
    const events: Array<IEvent> = await EventPoller.getEventsAsync(
      eventsFilter,
      (key === "no key") ? 5000 : 2000, //in milliseconds
      web3Client.smartContracts()
    );
    if (key === "no key") {
      console.log("Events", events);
      if (events.length) {
        setEvent(true);
      }
      events.forEach((item) => {
        if (item.data.indexOf('SC_Address:') + 1) {
          sc_addr = item.data.replace('SC_Address:', '');
          console.log(sc_addr);
        }
      });
    } else {
      events.forEach((item) => {
        if (item.data.indexOf('sended data' + key) + 1) {
          setLoading(false);
          clearInterval(interval);
          setMessage("Data was sended");
          setProgress(100);
          setOpen(true);
          setData({
            id: "",
            Classification: "article",
            imageUrl: "",
            title: "",
            locale: "en",
            body: "",
          })
        }
      });
    }
  }

  const getNodeStatusAsync = async () => {
    try {
      const nodeStatus: INodeStatus = await web3Client
        .publicApi()
        .getNodeStatus();
      setNodeStatus(nodeStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const viewArticle = (value: { key: string; }) => {
    getData(value.key);
  }

  return (
    <div id="root">
      <div className="campaign-management">
        <div className="campaign-management__wrapper">
          <div className="MainLayout new-ui-main">
            <header className="TopBar">
              <div className="TopBar__container">
                <a href="/" style={{ textDecoration: 'none', fontSize: 18, fontWeight: 'bold' }}>
                  <div className="Logo TopBar__logo">
                    <div className="Logo__icon">
                      <img src={logo} />
                    </div>
                    <span style={{ fontWeight: 'bold' }}>Digital Content<br />Marketplace</span>
                  </div>
                </a>
                <div className="BurgerMenu  TopBar__menu"><div></div></div>
                <nav>
                  <a className={menuNumber === 0 ? "active" : ""} onClick={() => {
                    setMenuNumber(0);
                  }}>My content</a>
                  <a className={(menuNumber === 1 && isEvent) ? "active" : ""} onClick={() => {
                    if (isEvent) {
                      getListArticles();
                      setMenuNumber(1);
                    }
                  }}>Articles</a>
                  <a className="">Orders</a>
                  <a className="">Deals</a>
                  <a className="">Bulk operations</a>
                </nav>
                <a href="/"><button className="ButtonNewUi ButtonNewUi--contained  " type="button">+ Create</button></a>
                <div className="UserInfo">
                  <div className="UserInfo__name">Roman Radchenko</div>
                  <div className="UserInfo__divider"></div>
                  <div className="UserInfo__balance">213 WMT</div>
                </div>
              </div>
            </header>
            <main>
              {menuNumber === 0 ?
                <AddArticle
                  isEvent={isEvent}
                  progress={progress}
                  isLoading={isLoading}
                  publishArticle={(value) => {
                    setData(value);
                    title = value.title;
                    setDataToSC(value);
                  }}
                />
                :
                /* <ListOfArticles
                  datainfo={datainfo}
                  viewArticle={(value) => {
                    viewArticle(value);
                  }}
                /> */
                <ListOfArticlesSC
                  datainfo={datainfoSC}
                  viewArticle={(value) => {
                    viewArticle(value);
                  }}
                />
              }
            </main>
          </div>
        </div>
      </div >
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {message}
          </DialogContentText>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openArticle}
        onClose={handleCloseArticle}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <div>
            <p>{articleData.title}</p>
            {articleData.imageUrl && <img src={articleData.imageUrl} style={{ width: "100%" }} />}
            <p>{articleData.body.substring(0, articleData.body.length - 1)}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openInfo}
        onClose={handleCloseInfo}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description"> Please, open DevTools </DialogContentText>
          {datainfo.map((item, index) => {
            return <div key={index}>
              <p>Key: {item.key} | OperationID: {item.operationId}</p>
              <Stack direction="row" spacing={2}>
                <Button style={{ fontSize: 11 }} onClick={() => getData(item.key)} variant="outlined">Get Data</Button>
                <Button style={{ fontSize: 11 }} onClick={() => readData(item.key)} variant="outlined">Read Data by SC Events</Button>
                <Button style={{ fontSize: 11 }} onClick={() => getOperation(item.operationId)} variant="outlined">Get Operation Data and Block Info</Button>
                <Button style={{ fontSize: 11 }} onClick={() => { window.open("https://experiment.massa.net/#explorer?explore=" + item.operationId + "&nocenter", '_blank'); }} variant="outlined">Open in Explorer</Button>
              </Stack>
              <hr />
            </div>
          })}
        </DialogContent>
      </Dialog>
    </div >
  );
}
export default App;
