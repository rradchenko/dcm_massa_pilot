import React from "react";

const ListOfArticles = (props: { datainfo: any[]; viewArticle: (value: any) => void; }) => {

  return (
    <div className="ContentEditor">
      <div className="container">
        <div className="ContentEditor__main" style={{ width: "100%", maxWidth: "100%" }}>
          <div className="ContentItemsContainer">
            {props.datainfo.map((item: { key: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; title: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined; operationId: string; imageUrl: string; }, index: React.Key | null | undefined) => {
              return <div key={index} style={{ width: "45%", float: "left", margin: 25, height: 360  }}>
                <div style={{ position: "relative", top: 50 }}>
                  <button style={{ borderRadius: 10, marginLeft: 10, height: 25 }} onClick={() => {
                    props.viewArticle(item);
                  }} type="button">View</button>
                  <button style={{ borderRadius: 10, marginLeft: 10, height: 25 }} onClick={() => { window.open("https://experiment.massa.net/#explorer?explore=" + item.operationId + "&nocenter", '_blank'); }}
                    type="button">Explorer</button>
                </div>
                <img src={item.imageUrl} style={{ width: "100%", height: "100%"}} />
                <hr />
                <div>
                  <p style={{ float: "left", display: "flex", fontSize: 18, textAlign: "center" }}>{item.title}</p>
                </div>
              </div>
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ListOfArticles;
