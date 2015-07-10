import request from 'superagent'
import jwt from 'jsonwebtoken'
import {
  UPLOAD_FILE_STARTED,
  UPLOAD_FILE_COMPLETED,
  UPLOAD_FILE_FAILED,
  UPLOAD_FILE_PROGRESS,
  SET_IMAGE_PREVIEW_COMPLETED,
  SET_IMAGE_FILENAME_COMPLETED,
  CLEAR_UPLOAD_COMPLETED
} from 'shared/constants/ActionTypes'
import { getToken } from 'shared/actions/AuthActions'

export function setPercent (percent, index) {
  return async dispatch => {
    return dispatch({
      type: UPLOAD_FILE_PROGRESS,
      percentage: percent.toFixed(0),
      index: index
    })
  }
}

export function send (filename, file, index) {
  return async dispatch => {
    dispatch({ type: UPLOAD_FILE_STARTED })
    dispatch(setImagePreview(null, index))
    const token = getToken()
    const user = jwt.decode(token)
    if (!user.id)
      return dispatch({
        type: UPLOAD_FILE_FAILED,
        errors: 'invalid token'
      })
    request
      .post('/api/v1/uploads')
      .attach('file', file, filename)
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT ' + token)
      .on('progress', (e) => {
        setTimeout(() => {
          dispatch(setPercent(e.percent, index))
        }, 0)
      })
      .end(function (err, res) {
        if (!err && res.body && res.body.response) {
          dispatch(setImageFileName(res.body.response.name, index))

          if (res.body.response.ext === 'pdf')
            dispatch(setImagePreview('/images/pdf.png', index))
          else
            dispatch(setImagePreview(file.preview, index))

          return dispatch({
            type: UPLOAD_FILE_COMPLETED,
            response: res.body.response
          })
        } else return dispatch({
          type: UPLOAD_FILE_FAILED,
          errors: err || res.body.errors,
          index: index
        })
      })
  }
}

export function setImagePreview (src, index) {
  return async dispatch => {
    return dispatch({
      type: SET_IMAGE_PREVIEW_COMPLETED,
      src: src,
      index: index
    })
  }
}

export function setImageFileName (filename, index) {
  return async dispatch => {
    return dispatch({
      type: SET_IMAGE_FILENAME_COMPLETED,
      filename: filename,
      index: index
    })
  }
}

export function clearUpload () {
  return async dispatch => {
    return dispatch({
      type: CLEAR_UPLOAD_COMPLETED
    })
  }
}