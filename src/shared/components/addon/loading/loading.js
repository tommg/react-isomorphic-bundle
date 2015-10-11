import React, { PropTypes } from 'react/addons'
const { CSSTransitionGroup } = React.addons

import Spinner from 'react-spinkit'

if (process.env.BROWSER) {
  require('css/addon/loading')
}
// thanks: https://gist.github.com/epeli/9887246
class Loading extends React.Component {

  static propTypes = {
    children: PropTypes.string
  }

  constructor (props) {
    super(props)
  }

  render () {
    const isAppear = true
    return (
      <CSSTransitionGroup
        transitionName="xloading"
        transitionAppear={isAppear}>
        <div className="xloading">
          <div className="xloading-wrap">
            <Spinner spinnerName="wordpress" />
            {this.props.children}
          </div>
        </div>
      </CSSTransitionGroup>
    )
  }
}

Loading.component = null

Loading.show = function (newComponent) {
  if (Loading.component) {
    Loading.hide()
  }
  Loading.component = newComponent

  React.render(
    <Loading>{newComponent}</Loading>,
    document.getElementById('loading-container')
  )
}
Loading.hide = function () {
  if (!Loading.component) return
  React.unmountComponentAtNode(document.getElementById('loading-container'))
  Loading.component = null
}

export default Loading
