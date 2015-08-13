import React, { PropTypes } from 'react'
import { BaseComponent } from 'shared/components'
import {
  Form,
  PostForm,
  PostFormOptions,
  RegForm,
  RegFormOptions
} from 'shared/utils/forms'
import { isEmpty, clone } from 'lodash'
import classNames from 'classnames'
import moment from 'moment'
import counterpart from 'counterpart'
import ImageUpload from 'shared/components/addon/image-upload'
import GMap from 'shared/components/addon/maps/gmap'
import {
  Tab,
  Tabs,
  TabList,
  TabPanel
} from 'shared/components/addon/tabs'
import { toDate } from 'shared/utils/date-utils'
import { getFileExt } from 'shared/utils/file-utils'
import { each } from 'lodash'
import $ from 'jquery'

let sweetAlert
if (process.env.BROWSER)
  sweetAlert = require('sweetalert')

const { CSSTransitionGroup } = React.addons

export default class Post extends BaseComponent {

  constructor (props) {
    super(props)
    this._bind(
      'handleSubmit',
      'validation',
      'handleChange',
      'handleRegChange'
    )
    this.releaseTimeout = undefined
    const today = this.dateToArray(moment().format('YYYY-M-D'))
    const { detail } = props.post
    this.state = {
      formInited: false,
      uploadInited: false,
      images: [],
      value: {
        type: '2',
        prop: '1',
        startDate: today,
        endDate: today,
        title: null,
        content: null
      },
      regValue: {
        openDate: today,
        closeDate: today
      },
      options: PostFormOptions(counterpart.getLocale()),
      regOptions: RegFormOptions(counterpart.getLocale()),
      submited: false,
      updated: false,
      locale: counterpart.getLocale(),
      placeError: false,
      latlngError: false
    }

    counterpart.onLocaleChange(::this.handleLocaleChange)
  }

  static propTypes = {
    submit: PropTypes.func.isRequired,
    modify: PropTypes.func.isRequired,
    search: PropTypes.func.isRequired,
    setPin: PropTypes.func.isRequired,
    setImageFileName: PropTypes.func.isRequired,
    setImagePreview: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    post: PropTypes.object.isRequired,
    upload: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    params: PropTypes.object
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  dateToArray (date) {
    let _date = date.split('-')
    _date[1] = _date[1] - 1
    return _date
  }

  handleLocaleChange (newLocale) {
    this.setState({
      options: PostFormOptions(newLocale),
      regOptions: RegFormOptions(newLocale)
    })
  }

  handleBoundsChange (event) {
    if (this.refs.lat)
      React.findDOMNode(this.refs.lat).value = event.center[0]
    if (this.refs.lng)
      React.findDOMNode(this.refs.lng).value = event.center[1]
  }

  handleSearch (event) {
    event.preventDefault()
    const address = React.findDOMNode(this.refs.place).value.trim()
    if (!address || address === counterpart('post.map.my'))
      this.runGeoLoc()
    else
      this.props.search(address)
  }

  handleGeo (event) {
    event.preventDefault()
    this.runGeoLoc()
  }

  runGeoLoc () {
    const self = this
    if (navigator.geolocation) {
      let optn = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
      navigator.geolocation
        .getCurrentPosition(self.showPosition.bind(self), this.showError, optn)

    } else sweetAlert('Geolocation is not supported in your browser')
  }

  showPosition (position) {
    const map = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }

    this.props.setPin(map)
  }

  showError (error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        sweetAlert('User denied the request for Geolocation.')
        break
      case error.POSITION_UNAVAILABLE:
        sweetAlert('Location information is unavailable.')
        break
      case error.TIMEOUT:
        sweetAlert('The request to get user location timed out.')
        break
      case error.UNKNOWN_ERROR:
        sweetAlert('An unknown error occurred.')
        break
      default:
        break
    }
  }

  handleMapSubmit (event) {
    event.preventDefault()
    const map = {
      place: React.findDOMNode(this.refs.place).value.trim(),
      lat: parseFloat(React.findDOMNode(this.refs.lat).value.trim()),
      lng: parseFloat(React.findDOMNode(this.refs.lng).value.trim())
    }

    if (!map.lat || !map.lng || !map.place) {
      if (!map.lat || !map.lng)
        this.setState({ latlngError: true })
      if (!map.place)
        this.setState({ placeError: true })

      return
    }

    this.props.setPin(map)
    this.setState({ latlngError: false })
    this.setState({ placeError: false })
  }

  handleChange (value) {
    this.setState({ value })
  }

  handleRegChange (regValue, path) {
    this.refs.regForm.getValue()
    this.setState({ regValue })
  }

  handleSelected (index, last) {
    if (index === 2 && !this.state.uploadInited) {
      const { detail } = this.props.post
      const { user } = this.props.auth

      const files = typeof detail.file !== 'undefined'
      ? JSON.parse(detail.file)
      : []

      let src
      let name
      each(files, (filename, _index) => {
        if (getFileExt(filename.toLowerCase()) === 'pdf') {
          name = 'pdf.png'
          src = user.aud + '/images/' + name
        } else {
          name = filename
          src = user.aud + '/uploads/' + name
        }

        this.props.setImageFileName(name, _index)
        this.props.setImagePreview(src, _index)
      })

      this.setState({ uploadInited: true })
    }
  }

  handleSubmit (evt) {
    evt.preventDefault()
    $('html, body').animate({ scrollTop: 0 }, 'slow')

    let value = this.refs.form.getValue()
    if (value) {
      let saved = clone(value)
      this.setState({ value: saved })
      this.setState({ submited: true })

      const upload = this.props.upload.filenames
      let map
      if (this.props.map.place)
        map = {
          place: this.props.map.place,
          lat: this.props.map.lat,
          lng: this.props.map.lng
      }

      const regValue = this.state.regValue

      setTimeout(() => {
        const { id } = this.props.params
        if (id)
          this.props.modify({ id, value, regValue, upload, map })
        else
          this.props.submit({ value, regValue, upload, map })

      }, 1000)
    }
  }

  clearFormErrors () {
    let options = clone(this.state.options)
    options.fields = clone(options.fields)

    for (let key in options.fields) {
      if (options.fields.hasOwnProperty(key)) {
        options.fields[key] = clone(options.fields[key])
        if (options.fields[key].hasOwnProperty('hasError'))
          options.fields[key].hasError = false
      }
    }
    this.setState({ options: options })
  }

  validation (errors) {
    if (typeof errors !== 'undefined' && !isEmpty(errors)) {
      let options = clone(this.state.options)
      options.fields = clone(options.fields)
      let regOptions = clone(this.state.regOptions)
      regOptions.fields = clone(regOptions.fields)

      if (typeof errors.map !== 'undefined')
        errors.map(function (err) {
          if (options.fields[err.field] !== 'undefined')
            if (err.code === 'invalid') {
              options.fields[err.field] = clone(options.fields[err.field])
              options.fields[err.field] = {
                hasError: true, error: err.message
              }
            } else {
              options.fields[err.path] = clone(options.fields[err.path])
              options.fields[err.path] = {
                hasError: true, error: err.message
              }
            }

          if (regOptions.fields[err.field] !== 'undefined')
            if (err.code === 'invalid') {
              regOptions.fields[err.field] = clone(regOptions.fields[err.field])
              regOptions.fields[err.field] = {
                hasError: true, error: err.message
              }
            } else {
              regOptions.fields[err.path] = clone(regOptions.fields[err.path])
              regOptions.fields[err.path] = {
                hasError: true, error: err.message
              }
            }

        })
      this.setState({ submited: false })
      this.setState({ options, regOptions })
    }
  }

  checkSubmited (content) {
    if (!isEmpty(content)) {
      this.setState({ submited: true })
      if (content.uid) this.setState({ updated: true, submited: true })
    }
  }

  initForm (detail) {
    if (!isEmpty(detail)) {
      const startDate = this.dateToArray(toDate(detail.startDate))
      const endDate = this.dateToArray(toDate(detail.endDate))
      const openDate = this.dateToArray(toDate(detail.openDate))
      const closeDate = this.dateToArray(toDate(detail.closeDate))
      this.setState({
        value: {
          type: detail.type.toString(),
          prop: detail.prop.toString(),
          startDate: startDate,
          endDate: endDate,
          title: detail.title,
          content: detail.content
        },
        regValue: {
          openDate: openDate,
          closeDate: closeDate,
          url: isEmpty(detail.url) ? undefined : detail.url
        }
      })

      const map = {
        lat: detail.lat,
        lng: detail.lng,
        place: detail.ocname || detail.place
      }
      this.props.setPin(map)

      return true
    }
    return false
  }

  componentWillReceiveProps (nextProps) {
    if (!this.state.formInited)
      if (this.initForm(nextProps.post.detail))
        this.setState({ formInited: true })

    this.validation(nextProps.post.errors)
    this.checkSubmited(nextProps.post.content)

    if (this.refs.lat)
      React.findDOMNode(this.refs.lat).value = nextProps.map.lat
    if (this.refs.lng)
      React.findDOMNode(this.refs.lng).value = nextProps.map.lng
  }

  componentWillUnmount () {
    if (this.op)
      clearTimeout(this.releaseTimeout)
  }

  render () {
    if (process.env.BROWSER)
      if (!isEmpty(this.props.post.content))
        this.releaseTimeout = setTimeout(() => {
          this.context.router.replaceWith('/wall/today')
        }, 1000)

    const Translate = require('react-translate-component')

    let Loading = this.state.submited
      && !this.state.updated
      ? classNames('ui', 'form', 'loading')
      : classNames('ui', 'form')

    let AdvancedInput = this.state.placeError
      ? classNames('ui', 'fluid', 'input', 'error')
      : classNames('ui', 'fluid', 'input')

    let PlaceInput = this.state.placeError
      ? classNames('ui', 'fluid', 'action', 'input', 'error')
      : classNames('ui', 'fluid', 'action', 'input')

    let LatLngInput = this.state.latlngError
      ? classNames('ui', 'fluid', 'labeled', 'input', 'error')
      : classNames('ui', 'fluid', 'labeled', 'input')

    let Message = this.state.updated
      ? (
        <div>
          <div className="ui success message">
            <div className="header">
              <Translate content="post.created.title" />
            </div>
            <p><Translate content="post.created.content" /></p>
          </div>
          <div className="ui hidden divider"></div>
        </div> )
      : null

    let UploadErrorMessage = this.props.upload.errorId
    ? (
      <div>
        <div className="ui error message">
          <div className="header">
            <Translate content="post.upload.error" />
          </div>
        </div>
        <div className="ui hidden divider"></div>
      </div> )
    : null

    return (
      <main className="ui two column stackable centered full page grid">
        <div className="column">
          <GMap
            ref="gmap"
            {...this.props.map}
            onBoundsChange={::this.handleBoundsChange}
          />
        </div>
        <div className="column">
          <CSSTransitionGroup transitionName="MessageTransition">
            {Message}
          </CSSTransitionGroup>
          <Tabs
            ref="tabs"
            onSelect={::this.handleSelected}
            selectedIndex={0}>
            <TabList>
              <Tab>
                <Translate content="post.tabs.title.basic" />
              </Tab>
              <Tab>
                <Translate content="post.tabs.title.advanced" />
              </Tab>
              <Tab>
                <Translate content="post.tabs.title.upload" />
              </Tab>
              <Tab>
                <Translate content="post.tabs.title.map" />
              </Tab>
            </TabList>
            <TabPanel index={0}>
              <form
                className={Loading}
                action="/posts/new"
                method="post"
                onSubmit={this.handleSubmit}>
                <Form
                  ref="form"
                  type={PostForm(counterpart.getLocale())}
                  options={this.state.options}
                  value={this.state.value}
                  onChange={this.handleChange}/>
                <div className="ui hidden divider" />
                <button
                  type="submit"
                  className="ui orange labeled icon large button"
                  disabled={this.state.submited}>
                  <Translate content="post.submit" />
                  <i className="add icon"></i>
                </button>
              </form>
            </TabPanel>
            <TabPanel index={1}>
              <form>
                <Form
                  ref="regForm"
                  type={RegForm(counterpart.getLocale())}
                  options={this.state.regOptions}
                  value={this.state.regValue}
                  onChange={this.handleRegChange}/>
              </form>
              <div className="ui orange center aligned segment">
                <Translate content="post.tabs.msg.urltips" />
              </div>
            </TabPanel>
            <TabPanel index={2}>
              <CSSTransitionGroup transitionName="MessageTransition">
                {UploadErrorMessage}
              </CSSTransitionGroup>
              <p>
                <Translate content="post.tabs.msg.upload" />
              </p>
              <div className="ui three column grid center aligned">
                <ImageUpload index={0} />
                <ImageUpload index={1} />
                <ImageUpload index={2} />
              </div>
              <div className="ui orange center aligned segment">
                <Translate content="post.tabs.msg.limit" />
              </div>
            </TabPanel>
            <TabPanel index={3}>
              <form
                onSubmit={::this.handleMapSubmit}>
                <div className={PlaceInput}>
                  <input
                    type="text"
                    placeholder="Place"
                    ref="place"
                    defaultValue={
                      this.props.map.place
                      || counterpart('post.map.my')
                    } />
                  <button
                    className="ui green button"
                    onClick={::this.handleSearch}>
                    <Translate content="post.map.search" />
                  </button>
                </div>
                <div className="ui pointing label visible">
                  <i><Translate content="post.map.tips" /></i>
                </div>
                <div className="ui hidden divider" />
                <div className={LatLngInput}>
                  <div className="ui label">
                    <Translate content="post.map.lat" />
                  </div>
                  <input
                    type="text"
                    placeholder="latitude"
                    ref="lat"
                    defaultValue={this.props.map.lat} />
                </div>
                <div className="ui hidden divider" />
                <div className={LatLngInput}>
                  <div className="ui label">
                    <Translate content="post.map.lng" />
                  </div>
                  <input type="text"
                    placeholder="longitude"
                    ref="lng"
                    defaultValue={this.props.map.lng} />
                </div>
                <div className="ui hidden divider" />
                <div className="ui list">
                  <div className="item">
                    <div className="left floated content">
                      <button
                        className="ui circular yellow icon button"
                        onClick={::this.handleGeo}>
                        <i className="icon large map"></i>
                      </button>
                    </div>
                    <div className="right floated content">
                      <button
                        className="ui large orange button">
                        <Translate content="post.map.update" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </TabPanel>
          </Tabs>
        </div>

      </main>
    )
  }
}

