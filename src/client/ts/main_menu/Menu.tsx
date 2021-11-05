import React from "react"
import ReactDOM from "react-dom";

import "../../style/master.scss";
import video from "../../MenuVideo.mp4";

interface IProps {
    name: string;
}

interface IState {
    liked?: boolean;
}

interface ButtonState {
    name: string;
}

class Button extends React.Component<IProps, ButtonState> {
    constructor(props: IProps) {
        super(props);
    }

    render() {
        return (
            <div className="button">
                {this.props.name}
            </div>
        );
    }
}


interface IPaddingProps {
    height: string;
}
class CollapsiblePadding extends React.Component<IPaddingProps> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="padding" style={{ flexBasis: this.props.height }}></div>
        );
    }
}

interface MenuProps {

}

interface MenuState {
    step: number;
}

class Menu extends React.Component<MenuProps, MenuState> {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <>
                <div className="menu">
                    <video id="bgvideo" preload="auto" autoPlay loop muted>
                        {/* <source src="http://ak3.picdn.net/shutterstock/videos/4207399/preview/stock-footage-man-hands-typing-on-a-computer-keyboard.mp4" type="video/mp4"/> */}
                        <source src={video} type="video/mp4" />
                        {/* <source src="movie.webm" type="video/webm"/> */}
                        {/* Sorry, your browser does not support HTML5 video. */}
                    </video>
                    <div className="menuContent">
                        {/* <div className="padding"></div> */}
                        <CollapsiblePadding height="100px" />
                        <div className="title">
                            Buccaneer
                        </div>
                        <div id="" className="buttons">
                            <Button name="New Game" />
                            <CollapsiblePadding height="1em" />
                            <Button name="Join With Code" />
                        </div>
                        <CollapsiblePadding height="100px" />
                    </div>
                </div>
            </>
        )
    }
}

export {
    Menu
}