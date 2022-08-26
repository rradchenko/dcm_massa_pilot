import React, { useState, useEffect } from "react";
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Switch from '@mui/material/Switch';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';


const AddArticle = (props: { isEvent: any; isLoading: any; progress: number; publishArticle: (arg0: { id: string; Classification: string; imageUrl: string; title: string; locale: string; body: string; }) => void; }) => {

  const [data, setData] = useState({
    id: "",
    Classification: "article",
    imageUrl: "",
    title: "",
    locale: "en",
    body: "",
  });

  useEffect(() => {
    if (!props.isLoading) {
      setData({
        id: "",
        Classification: "article",
        imageUrl: "",
        title: "",
        locale: "en",
        body: "",
      });
    }
  }, [props.isLoading])

  const handleChange = (event: SelectChangeEvent) => {
    setData({ ...data, locale: event.target.value });
  };

  return (
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
                console.log(e.target.value.replace(/"/g,""));
                setData({ ...data, body: e.target.value.replace(/'/g,"").replace(/"/g,"").replace(/\r?\n/g, "") })
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
            {props.isEvent && (
              <div style={{ textAlign: 'center', borderWidth: 0.2, borderStyle: 'solid', borderTopRightRadius: 15, borderTopLeftRadius: 15, backgroundColor: '#e0fbe0', borderColor: '#e0fbe0' }}>
                <p style={{ color: 'green' }}>Ready to publish</p>
              </div>
            )}
            {props.isEvent && (
              <div className="ContentSettingsForm__btn-wrapper" style={{ textAlign: 'center', padding: 20, borderStyle: 'solid', borderWidth: 0.2, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, borderColor: '#e0fbe0' }}>
                {props.isLoading ?
                  <Box sx={{ position: 'relative', display: 'inline-flex' }} style={{ marginLeft: 40 }}>
                    <CircularProgress variant="determinate" value={props.progress} />
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
                      >{`${Math.round(props.progress)}%`}</Typography>
                    </Box>
                  </Box>
                  :
                  <button onClick={() => {
                    props.publishArticle(data);
                  }} className="MuiButtonBase-root MuiButton-root jss84 MuiButton-contained MuiButton-containedPrimary jss85" type="button">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AddArticle;
