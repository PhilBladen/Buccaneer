"use strict"
import React from "react"
import ReactDOM from "react-dom"

class LikeButton extends React.Component {
    constructor(props) {
        super(props)
        this.state = { liked: false }
    }

    render() {
        if (this.state.liked) {
            return "You liked this."
        }

        return (
            <button onClick={() => this.setState({ liked: true })}>
              Like
            </button>
        )
    }
}

ReactDOM.render(<LikeButton />, document.getElementById("react-container"))
