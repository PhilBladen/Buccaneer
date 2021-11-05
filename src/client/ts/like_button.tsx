import React from "react"
import ReactDOM from "react-dom"

interface IProps {
    
}

interface IState {
    liked?: boolean;
  }

class LikeButton extends React.Component<IProps, IState> {
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
