import React from 'react';
import Popup from "reactjs-popup";

export default function Popup(bool){
    return (
      <Popup trigger={bool} position="right center">
        <div>Popup content here !!</div>
      </Popup>
    )
}
