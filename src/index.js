// import * as bootstrap from "bootstrap";
import "../scss/style.scss";
// import "../scss/blog.scss";

import bootstrap from "bootstrap";
import Holder from "holderjs/holder";
import lozad from 'lozad';

const observer = lozad(); // lazy loads elements with default selector as '.lozad'
observer.observe();

Holder.addTheme("dark", {background:"#000", foreground:"#aaa", size:11, font: "Monaco"});