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
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Switch from '@mui/material/Switch';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import logo from './images/dcm-logo-short.svg';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const baseAccount = {
  privateKey: "2cr6PaYfzw8EAW7B4BzFMQfQSmTGooHMZxaVrxDbiaiThi4ADL",
  publicKey: "czDkh4KSQTD3iin5NfQb9YC2QE1PVo7AHyGe4zRMr6fWF9yHz",
  address: "A12aLE9N79i2uznhsfjx4FUjkoHyLxJfiwE9Fz3h2maGt1Q3jDs1"
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

let sc_addr = "A12aLE9N79i2uznhsfjx4FUjkoHyLxJfiwE9Fz3h2maGt1Q3jDs1";
let interval: string | number | NodeJS.Timer | undefined;

const App = () => {

  const [data, setData] = useState({
    id: "",
    Classification: "article",
    imageUrl: "",
    title: "",
    locale: "en",
    body: "",
  });
  const [open, setOpen] = useState<boolean>(false);
  const [openInfo, setOpenInfo] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isEvent, setEvent] = useState<boolean>(false);
  const [datainfo, setDataInfo] = useState<{ key: string; operationId: string[] }[]>([]);
  const [nodeStatus, setNodeStatus] = useState<TNodeStatus>(null);
  const [progress, setProgress] = useState<number>(0);

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

  useEffect(() => {
    console.log("Massa Net Version: " + nodeStatus?.version);
    console.log("Massa Net Node Id: " + nodeStatus?.node_ip);
    console.log("Massa Net Time: " + nodeStatus?.current_time);
    console.log("Massa Net Cycle: " + nodeStatus?.current_cycle);
  }, [nodeStatus]);

  const setDataToSC = async () => {
    setLoading(true);
    let key = uuidv4();
    let accumulated;
    let modulo;
    const datavalue = { ...data, id: key };
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
      parameter: sc_addr + "|" + key + "|" + chunks[0]
    });

    setProgress(10);

    const status = await web3Client.smartContracts().awaitRequiredOperationStatus(callSetData[0], EOperationStatus.FINAL);
    console.log(status);

    setDataInfo(prevDataInfo => [
      ...prevDataInfo, { key: key.toString(), operationId: callSetData }
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

      //await timer(12000);
      
      const status = await web3Client.smartContracts().awaitRequiredOperationStatus(callAppend[0], EOperationStatus.FINAL);
      console.log(status);
      setProgress((prevProgress) => (i*100/pieces.length));

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
    const data: Array<IContractReadOperationData> = await web3Client.smartContracts().readSmartContract({
      fee: 0,
      maxGas: 200000,
      simulatedGasPrice: 0,
      targetAddress: sc_addr,
      targetFunction: "readData",
      parameter: sc_addr + "|" + key,
      callerAddress: baseAccount.address
    } as IReadData);

    if (data[0].result === "Ok") {
      console.log(data[0].output_events[0].data);
    } else {
      console.log(data[0].result)
    }
  }

  const getData = async (key: string) => {
    try {
      const data: IContractStorageData | null = await web3Client.publicApi().getDatastoreEntry(sc_addr, key);
      console.log('Data ->', data);
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

  const handleChange = (event: SelectChangeEvent) => {
    setData({ ...data, locale: event.target.value });
  };

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
                  <a className="active" href="/">My content</a>
                  <a className="" href="/">Marketplace</a>
                  <a className="" href="/">Orders</a>
                  <a className="" href="/">Deals</a>
                  <a className="" href="/">Bulk operations</a>
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
              <div className="ContentEditor">
                <div className="container">
                  <div className="ContentEditor__left-side">
                    <div className="ContentSettingsForm">
                      <div className="TopBar" style={{ backgroundColor: 'transparent' }}>
                        <nav>
                          <a className="active" href="/creator/content/">Req. settings</a>
                          <a className="" href="/creator/marketplace">Optional</a>
                        </nav>
                      </div>
                      <FormControl fullWidth sx={{ minWidth: 120 }}>
                        <FormHelperText style={{
                          margin: '10px 10px 10px 0px',
                          color: 'grey',
                          fontSize: 14
                        }}>Primary language</FormHelperText>
                        <Select
                          labelId="demo-simple-select-standard-label"
                          id="demo-simple-select-standard"
                          value={data?.locale}
                          onChange={handleChange}
                          label="Language"
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="fr">French</MenuItem>
                          <MenuItem value="ge">German</MenuItem>
                          <MenuItem value="sp">Spanish</MenuItem>
                          <MenuItem value="po">Polish</MenuItem>
                          <MenuItem value="ru">Russian</MenuItem>
                          <MenuItem value="ua">Ukrainian</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                  <div className="ContentEditor__main">
                    <div className="ContentItemsContainer">
                      <p>Title (H1 text)</p>
                      <div className="ItemWrapper">
                        <input value={data.title} onChange={(e) => {
                          setData({ ...data, title: e.target.value })
                        }} style={{ width: "100%", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0.2 }} />
                      </div>
                      <p>Preview Image (use url to img)</p>
                      <div className="ItemWrapper">
                        <input value={data.imageUrl} onChange={(e) => {
                          setData({ ...data, imageUrl: e.target.value })
                        }} style={{ width: "100%", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0.2 }} />
                      </div>
                      {data.imageUrl && <img src={data.imageUrl} style={{ width: "100%" }} />}
                      <p>Main text(p)</p>
                      <div className="ItemWrapper">
                        <textarea value={data.body} onChange={(e) => {
                          setData({ ...data, body: e.target.value })
                        }} style={{ width: "100%", borderWidth: 0.2, height: 250 }} />
                      </div>
                    </div>
                  </div>
                  <div className="ContentEditor__right-side">
                    <div style={{ flexDirection: 'row', display: 'flex', justifyContent: 'space-between', padding: 10 }}>
                      <p>Check AI Warnings</p>
                      <p style={{ marginRight: 25 }}>{'>'}</p>
                    </div>
                    <div className="ContentSettingsForm">
                      <div style={{
                        flexDirection: 'row', display: 'flex', justifyContent: 'space-between', borderStyle: 'solid',
                        borderTopWidth: 0.2,
                        borderBottomWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                        borderColor: '#d5d5d5',
                        padding: 10
                      }}>
                        <p>NFT Publishing</p>
                        <Switch />
                      </div>
                      <div style={{
                        flexDirection: 'row', display: 'flex', justifyContent: 'space-between', borderStyle: 'solid',
                        borderTopWidth: 0.2,
                        borderBottomWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                        borderColor: '#d5d5d5',
                        padding: 10
                      }}>
                        <p>Custom price</p>
                        <Switch />
                      </div>
                      <div style={{
                        flexDirection: 'row', display: 'flex', justifyContent: 'space-between', borderStyle: 'solid',
                        borderTopWidth: 0.2,
                        borderBottomWidth: 0,
                        borderLeftWidth: 0,
                        borderRightWidth: 0,
                        borderColor: '#d5d5d5',
                        padding: 10
                      }}>
                        <p>Add Options</p>
                        <Switch />
                      </div>
                      {isEvent && (
                        <div style={{ textAlign: 'center', borderWidth: 0.2, borderStyle: 'solid', borderTopRightRadius: 15, borderTopLeftRadius: 15, backgroundColor: '#e0fbe0', borderColor: '#e0fbe0' }}>
                          <p style={{ color: 'green' }}>Ready to publish</p>
                        </div>
                      )}
                      {isEvent && (
                        <div className="ContentSettingsForm__btn-wrapper" style={{ textAlign: 'center', padding: 20, borderStyle: 'solid', borderWidth: 0.2, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, borderColor: '#e0fbe0' }}>
                          {isLoading ?
                          <Box sx={{ position: 'relative', display: 'inline-flex' }} style={{ marginLeft: 40 }}>
                          <CircularProgress variant="determinate" value={progress} />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              component="div"
                              color="text.secondary"
                            >{`${Math.round(progress)}%`}</Typography>
                          </Box>
                        </Box>
                             :
                            <button onClick={setDataToSC} className="MuiButtonBase-root MuiButton-root jss84 MuiButton-contained MuiButton-containedPrimary jss85" type="button">
                              <span className="MuiButton-label">Publish</span>
                              <span className="MuiTouchRipple-root"></span>
                            </button>}
                          <button className="MuiButtonBase-root MuiButton-root jss84 MuiButton-outlined jss87" type="button">
                            <span className="MuiButton-label">Save to Draft</span>
                            <span className="MuiTouchRipple-root"></span>
                          </button>
                          <button className="MuiButtonBase-root MuiButton-root jss84 MuiButton-outlined jss87" type="button">
                            <span className="MuiButton-label">Delete</span>
                            <span className="MuiTouchRipple-root"></span>
                          </button>
                          <div onClick={() => setOpenInfo(true)}>
                            <p style={{ color: "#5E6C84" }}> Show Info </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
