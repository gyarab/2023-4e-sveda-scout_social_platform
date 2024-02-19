import '../styles/globals.sass'
import '../styles/navbar.sass'
import {BiMenu} from "react-icons/bi";
import {useState} from "react";

export default function NavBar() {
    const [optionsDisplayed, setOptionsDisplayed] = useState(false)

    const rollNavBar = () => {
        setOptionsDisplayed(!optionsDisplayed)
    }

    return (
        <div className={`box nav-box ${optionsDisplayed ? 'height420' : ""}`}>
            <button
                className={'nav-button'}
                onClick={() => rollNavBar()}
            >
                <div className={'box nav-items'}>
                    <div className={'nav-item'}>
                        Homepage
                    </div>
                    <div className={'nav-item'}>
                        Messages
                    </div>
                    <div className={'nav-item'}>
                        Me
                    </div>
                    <div className={'nav-item'}>
                        Plan
                    </div>
                    <div className={'nav-item'}>
                        Search
                    </div>
                    <div className={'nav-item'}>
                        Auth
                    </div>
                </div>
                <BiMenu/>
            </button>

        </div>
    )
}