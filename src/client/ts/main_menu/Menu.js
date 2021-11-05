import React, { Component } from "react"
import ReactDOM from "react-dom"

import "../../style/master.scss"
import video from "../../MenuVideo.mp4"
// import M from "materialize-css";
// import "materialize-css/dist/css/materialize.min.css";

import { TextField, createTheme, ThemeProvider } from "@mui/material"

const Button = ({ name, click, disabled = false }) => {
    return (
        <div
            className={"button " + (disabled ? "disabled" : "")}
            onClick={click}
        >
            {name}
        </div>
    )
}

class CollapsiblePadding extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div
                className="padding"
                style={{ flexBasis: this.props.height }}
            ></div>
        )
    }
}

class MenuContent extends Component {
    state = {
        step: 1,
    }

    prevStep = () => {
        const { step } = this.state
        this.setState({ step: step - 1 })
    }

    nextStep = () => {
        const { step } = this.state
        this.setState({ step: step + 1 })
    }

    handleChange = (input) => (e) => {
        this.setState({ [input]: e.target.value })
    }

    render() {
        const { step } = this.state
        const {
            email,
            username,
            code,
            firstName,
            lastName,
            country,
            levelOfEducation,
        } = this.state
        const values = {
            email,
            username,
            code,
            firstName,
            lastName,
            country,
            levelOfEducation,
        }

        switch (step) {
            case 1:
                return (
                    <MenuStart
                        nextStep={this.nextStep}
                        handleChange={this.handleChange}
                        values={values}
                    />
                )
            case 2:
                return (
                    <MenuNewGame
                        nextStep={this.nextStep}
                        prevStep={this.prevStep}
                        handleChange={this.handleChange}
                    />
                )
            case 3:
                return <Confirmation />
            case 4:
                return <Success />
            default:
                return null
        }
    }
}

const MenuStart = ({ nextStep, handleChange, values }) => {
    const Continue = (e) => {
        e.preventDefault()
        nextStep()
        console.log("Continue")
    }

    return (
        <>
            <CollapsiblePadding height="100px" />
            <div className="title">Buccaneer</div>
            <div id="" className="buttons">
                <Button name="New Game" click={Continue} />
                <CollapsiblePadding height="1em" />
                <Button name="Join With Code" />
            </div>
            <CollapsiblePadding height="100px" />
        </>
    )
}

const theme = createTheme({
    typography: {
        // In Chinese and Japanese the characters are usually larger,
        // so a smaller fontsize may be appropriate.
        fontSize: 60,
        color: "common.white"
    },
    palette: {
        primary: {
          light: '#757ce8',
          main: '#3f50b5',
          dark: '#002884',
          contrastText: '#fff',
        },
        secondary: {
          light: '#ff7961',
          main: '#f44336',
          dark: '#ba000d',
          contrastText: '#000',
        },
      },
})

class SearchComponent extends React.Component {
    handleSubmitClicked() {
        this.setState({
            isDisabled: true,
        })
    }

    constructor(props) {
        super(props)

        this.state = {
            isDisabled: false,
        }
    }

    render() {
        return (
            <div>
                <input type="text" disabled={this.state.isDisabled} />
                <button
                    disabled={this.state.isDisabled}
                    onClick={this.handleSubmitClicked.bind(this)}
                >
                    Submit Query
                </button>
            </div>
        )
    }
}

class MenuNewGame extends Component {
    //= ({ nextStep, prevStep }) =>
    constructor(props) {
        super(props)

        this.state = {
            disabled: true,
            code: ""
        }
    }

    // const handleChange = (input) => (e) => {
    //     this.setState({ [input]: e.target.value })
    // }

    handleChange(input) {
        return (e) => {
            this.setState({ [input]: e.target.value }, () => {
                if (this.state.code.length == 4) {
                    this.setState({disabled: false});
                } else {
                    this.setState({disabled: true});
                }
            })
        }
    }

    render() {
        return (
            <>
                <ThemeProvider theme={theme}>
                    <CollapsiblePadding height="100px" />
                    <div className="title">Buccaneer</div>
                    <div className="title">A94B</div>
                    <TextField
                        label="Code"
                        variant="standard"
                        style={{ fontSize: "10em" }}
                        onChange={this.handleChange("code")}
                    />
                    <SearchComponent />
                    <div id="" className="buttons">
                        <Button
                            name="Join Game"
                            disabled={this.state.disabled}
                        />
                        <Button name="Back" click={this.props.prevStep} />
                    </div>
                    <CollapsiblePadding height="100px" />
                </ThemeProvider>
            </>
        )
    }
}

class Menu extends Component {
    render() {
        return (
            <div className="menu">
                <video id="bgvideo" preload="auto" autoPlay loop muted>
                    <source src={video} type="video/mp4" />
                </video>
                <div className="menuContent">
                    <MenuContent />
                </div>
            </div>
        )
    }
}

export { Menu }
