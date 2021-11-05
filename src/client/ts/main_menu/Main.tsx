import React from 'react'
import ReactDOM from 'react-dom'
import { Menu } from './Menu';

ReactDOM.render(
    <Menu name="" />,
    document.getElementById('react-container') // eslint-disable-line no-undef
)

if (module.hot) // eslint-disable-line no-undef  
    module.hot.accept() // eslint-disable-line no-undef  

