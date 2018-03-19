import defaultParams, { deprecatedParams } from './utils/params.js'
import { swalClasses, iconTypes } from './utils/classes.js'
import { formatInputOptions, warn, error, warnOnce, callIfFunction } from './utils/utils.js'
import * as dom from './utils/dom.js'

let popupParams = Object.assign({}, defaultParams)
let queue = []
let currentContext

let previousWindowKeyDown, windowOnkeydownOverridden

/**
 * Show relevant warnings for given params
 *
 * @param params
 */
const showWarningsForParams = (params) => {
  for (const param in params) {
    if (!sweetAlert.isValidParameter(param)) {
      warn(`Unknown parameter "${param}"`)
    }
    if (sweetAlert.isDeprecatedParameter(param)) {
      warnOnce(`The parameter "${param}" is deprecated and will be removed in the next major release.`)
    }
  }
}

/**
 * Set type, text and actions on popup
 *
 * @param params
 * @returns {boolean}
 */
const setParameters = (params) => {
  // Determine if the custom target element is valid
  if (
    !params.target ||
    (typeof params.target === 'string' && !document.querySelector(params.target)) ||
    (typeof params.target !== 'string' && !params.target.appendChild)
  ) {
    warn('Target parameter is not valid, defaulting to "body"')
    params.target = 'body'
  }

  let popup
  const oldPopup = dom.getPopup()
  let targetElement = typeof params.target === 'string' ? document.querySelector(params.target) : params.target
  // If the model target has changed, refresh the popup
  if (oldPopup && targetElement && oldPopup.parentNode !== targetElement.parentNode) {
    popup = dom.init(params)
  } else {
    popup = oldPopup || dom.init(params)
  }

  // Set popup width
  if (params.width) {
    popup.style.width = (typeof params.width === 'number') ? params.width + 'px' : params.width
  }

  // Set popup padding
  if (params.padding) {
    popup.style.padding = (typeof params.padding === 'number') ? params.padding + 'px' : params.padding
  }

  // Set popup background
  if (params.background) {
    popup.style.background = params.background
  }
  const popupBackgroundColor = window.getComputedStyle(popup).getPropertyValue('background-color')
  const successIconParts = popup.querySelectorAll('[class^=swal2-success-circular-line], .swal2-success-fix')
  for (let i = 0; i < successIconParts.length; i++) {
    successIconParts[i].style.backgroundColor = popupBackgroundColor
  }

  const container = dom.getContainer()
  const title = dom.getTitle()
  const content = dom.getContent().querySelector('#' + swalClasses.content)
  const actions = dom.getActions()
  const confirmButton = dom.getConfirmButton()
  const cancelButton = dom.getCancelButton()
  const closeButton = dom.getCloseButton()
  const footer = dom.getFooter()

  // Title
  if (params.titleText) {
    title.innerText = params.titleText
  } else if (params.title) {
    title.innerHTML = params.title.split('\n').join('<br />')
  }

  if (typeof params.backdrop === 'string') {
    dom.getContainer().style.background = params.backdrop
  } else if (!params.backdrop) {
    dom.addClass([document.documentElement, document.body], swalClasses['no-backdrop'])
  }

  // Content as HTML
  if (params.html) {
    dom.parseHtmlToContainer(params.html, content)

  // Content as plain text
  } else if (params.text) {
    content.textContent = params.text
    dom.show(content)
  } else {
    dom.hide(content)
  }

  // Position
  if (params.position in swalClasses) {
    dom.addClass(container, swalClasses[params.position])
  } else {
    warn('The "position" parameter is not valid, defaulting to "center"')
    dom.addClass(container, swalClasses.center)
  }

  // Grow
  if (params.grow && typeof params.grow === 'string') {
    let growClass = 'grow-' + params.grow
    if (growClass in swalClasses) {
      dom.addClass(container, swalClasses[growClass])
    }
  }

  // Animation
  if (typeof params.animation === 'function') {
    params.animation = params.animation.call()
  }

  // Close button
  if (params.showCloseButton) {
    closeButton.setAttribute('aria-label', params.closeButtonAriaLabel)
    dom.show(closeButton)
  } else {
    dom.hide(closeButton)
  }

  // Default Class
  popup.className = swalClasses.popup
  if (params.toast) {
    dom.addClass([document.documentElement, document.body], swalClasses['toast-shown'])
    dom.addClass(popup, swalClasses.toast)
  } else {
    dom.addClass(popup, swalClasses.modal)
  }

  // Custom Class
  if (params.customClass) {
    dom.addClass(popup, params.customClass)
  }

  // Progress steps
  let progressStepsContainer = dom.getProgressSteps()
  let currentProgressStep = parseInt(params.currentProgressStep === null ? sweetAlert.getQueueStep() : params.currentProgressStep, 10)
  if (params.progressSteps && params.progressSteps.length) {
    dom.show(progressStepsContainer)
    dom.empty(progressStepsContainer)
    if (currentProgressStep >= params.progressSteps.length) {
      warn(
        'Invalid currentProgressStep parameter, it should be less than progressSteps.length ' +
        '(currentProgressStep like JS arrays starts from 0)'
      )
    }
    params.progressSteps.forEach((step, index) => {
      let circle = document.createElement('li')
      dom.addClass(circle, swalClasses.progresscircle)
      circle.innerHTML = step
      if (index === currentProgressStep) {
        dom.addClass(circle, swalClasses.activeprogressstep)
      }
      progressStepsContainer.appendChild(circle)
      if (index !== params.progressSteps.length - 1) {
        let line = document.createElement('li')
        dom.addClass(line, swalClasses.progressline)
        if (params.progressStepsDistance) {
          line.style.width = params.progressStepsDistance
        }
        progressStepsContainer.appendChild(line)
      }
    })
  } else {
    dom.hide(progressStepsContainer)
  }

  // Icon
  const icons = dom.getIcons()
  for (let i = 0; i < icons.length; i++) {
    dom.hide(icons[i])
  }
  if (params.type) {
    let validType = false
    for (let iconType in iconTypes) {
      if (params.type === iconType) {
        validType = true
        break
      }
    }
    if (!validType) {
      error(`Unknown alert type: ${params.type}`)
      return false
    }
    const icon = popup.querySelector(`.${swalClasses.icon}.${iconTypes[params.type]}`)
    dom.show(icon)

    // Animate icon
    if (params.animation) {
      dom.addClass(icon, `swal2-animate-${params.type}-icon`)
    }
  }

  // Custom image
  const image = dom.getImage()
  if (params.imageUrl) {
    image.setAttribute('src', params.imageUrl)
    image.setAttribute('alt', params.imageAlt)
    dom.show(image)

    if (params.imageWidth) {
      image.setAttribute('width', params.imageWidth)
    } else {
      image.removeAttribute('width')
    }

    if (params.imageHeight) {
      image.setAttribute('height', params.imageHeight)
    } else {
      image.removeAttribute('height')
    }

    image.className = swalClasses.image
    if (params.imageClass) {
      dom.addClass(image, params.imageClass)
    }
  } else {
    dom.hide(image)
  }

  // Cancel button
  if (params.showCancelButton) {
    cancelButton.style.display = 'inline-block'
  } else {
    dom.hide(cancelButton)
  }

  // Confirm button
  if (params.showConfirmButton) {
    dom.removeStyleProperty(confirmButton, 'display')
  } else {
    dom.hide(confirmButton)
  }

  // Actions (buttons) wrapper
  if (!params.showConfirmButton && !params.showCancelButton) {
    dom.hide(actions)
  } else {
    dom.show(actions)
  }

  // Edit text on confirm and cancel buttons
  confirmButton.innerHTML = params.confirmButtonText
  cancelButton.innerHTML = params.cancelButtonText

  // ARIA labels for confirm and cancel buttons
  confirmButton.setAttribute('aria-label', params.confirmButtonAriaLabel)
  cancelButton.setAttribute('aria-label', params.cancelButtonAriaLabel)

  // Add buttons custom classes
  confirmButton.className = swalClasses.confirm
  dom.addClass(confirmButton, params.confirmButtonClass)
  cancelButton.className = swalClasses.cancel
  dom.addClass(cancelButton, params.cancelButtonClass)

  // Buttons styling
  if (params.buttonsStyling) {
    dom.addClass([confirmButton, cancelButton], swalClasses.styled)

    // Buttons background colors
    if (params.confirmButtonColor) {
      confirmButton.style.backgroundColor = params.confirmButtonColor
    }
    if (params.cancelButtonColor) {
      cancelButton.style.backgroundColor = params.cancelButtonColor
    }

    // Loading state
    const confirmButtonBackgroundColor = window.getComputedStyle(confirmButton).getPropertyValue('background-color')
    confirmButton.style.borderLeftColor = confirmButtonBackgroundColor
    confirmButton.style.borderRightColor = confirmButtonBackgroundColor
  } else {
    dom.removeClass([confirmButton, cancelButton], swalClasses.styled)

    confirmButton.style.backgroundColor = confirmButton.style.borderLeftColor = confirmButton.style.borderRightColor = ''
    cancelButton.style.backgroundColor = cancelButton.style.borderLeftColor = cancelButton.style.borderRightColor = ''
  }

  // Footer
  dom.parseHtmlToContainer(params.footer, footer)

  // CSS animation
  if (params.animation === true) {
    dom.removeClass(popup, swalClasses.noanimation)
  } else {
    dom.addClass(popup, swalClasses.noanimation)
  }

  // showLoaderOnConfirm && preConfirm
  if (params.showLoaderOnConfirm && !params.preConfirm) {
    warn(
      'showLoaderOnConfirm is set to true, but preConfirm is not defined.\n' +
      'showLoaderOnConfirm should be used together with preConfirm, see usage example:\n' +
      'https://sweetalert2.github.io/#ajax-request'
    )
  }
}

/**
 * Animations
 *
 * @param animation
 * @param onBeforeOpen
 * @param onComplete
 */
const openPopup = (animation, onBeforeOpen, onComplete) => {
  const container = dom.getContainer()
  const popup = dom.getPopup()

  if (onBeforeOpen !== null && typeof onBeforeOpen === 'function') {
    onBeforeOpen(popup)
  }

  if (animation) {
    dom.addClass(popup, swalClasses.show)
    dom.addClass(container, swalClasses.fade)
    dom.removeClass(popup, swalClasses.hide)
  } else {
    dom.removeClass(popup, swalClasses.fade)
  }
  dom.show(popup)

  // scrolling is 'hidden' until animation is done, after that 'auto'
  container.style.overflowY = 'hidden'
  if (dom.animationEndEvent && !dom.hasClass(popup, swalClasses.noanimation)) {
    popup.addEventListener(dom.animationEndEvent, function swalCloseEventFinished () {
      popup.removeEventListener(dom.animationEndEvent, swalCloseEventFinished)
      container.style.overflowY = 'auto'
    })
  } else {
    container.style.overflowY = 'auto'
  }

  dom.addClass([document.documentElement, document.body, container], swalClasses.shown)
  if (dom.isModal()) {
    fixScrollbar()
    iOSfix()
  }
  dom.states.previousActiveElement = document.activeElement
  if (onComplete !== null && typeof onComplete === 'function') {
    setTimeout(() => {
      onComplete(popup)
    })
  }
}

const fixScrollbar = () => {
  // for queues, do not do this more than once
  if (dom.states.previousBodyPadding !== null) {
    return
  }
  // if the body has overflow
  if (document.body.scrollHeight > window.innerHeight) {
    // add padding so the content doesn't shift after removal of scrollbar
    dom.states.previousBodyPadding = document.body.style.paddingRight
    document.body.style.paddingRight = dom.measureScrollbar() + 'px'
  }
}

const undoScrollbar = () => {
  if (dom.states.previousBodyPadding !== null) {
    document.body.style.paddingRight = dom.states.previousBodyPadding
    dom.states.previousBodyPadding = null
  }
}

// Fix iOS scrolling http://stackoverflow.com/q/39626302/1331425
const iOSfix = () => {
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  if (iOS && !dom.hasClass(document.body, swalClasses.iosfix)) {
    const offset = document.body.scrollTop
    document.body.style.top = (offset * -1) + 'px'
    dom.addClass(document.body, swalClasses.iosfix)
  }
}

const undoIOSfix = () => {
  if (dom.hasClass(document.body, swalClasses.iosfix)) {
    const offset = parseInt(document.body.style.top, 10)
    dom.removeClass(document.body, swalClasses.iosfix)
    document.body.style.top = ''
    document.body.scrollTop = (offset * -1)
  }
}

// SweetAlert entry point
const sweetAlert = (...args) => {
  // Prevent run in Node env
  if (typeof window === 'undefined') {
    return
  }

  // Check for the existence of Promise
  if (typeof Promise === 'undefined') {
    error('This package requires a Promise library, please include a shim to enable it in this browser (See: https://github.com/sweetalert2/sweetalert2/wiki/Migration-from-SweetAlert-to-SweetAlert2#1-ie-support)')
  }

  if (typeof args[0] === 'undefined') {
    error('SweetAlert2 expects at least 1 attribute!')
    return false
  }

  const context = currentContext = {}

  const params = context.params = Object.assign({}, popupParams)

  switch (typeof args[0]) {
    case 'string':
      [params.title, params.html, params.type] = args
      break

    case 'object':
      showWarningsForParams(args[0])
      Object.assign(params, args[0])
      params.extraParams = args[0].extraParams

      if (params.input === 'email' && params.inputValidator === null) {
        const inputValidator = (email) => {
          return new Promise((resolve, reject) => {
            const emailRegex = /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]{2,24}$/
            if (emailRegex.test(email)) {
              resolve()
            } else {
              reject('Invalid email address')
            }
          })
        }
        params.inputValidator = params.expectRejections ? inputValidator : sweetAlert.adaptInputValidator(inputValidator)
      }

      if (params.input === 'url' && params.inputValidator === null) {
        const inputValidator = (url) => {
          return new Promise((resolve, reject) => {
            // taken from https://stackoverflow.com/a/3809435/1331425
            const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/
            if (urlRegex.test(url)) {
              resolve()
            } else {
              reject('Invalid URL')
            }
          })
        }
        params.inputValidator = params.expectRejections ? inputValidator : sweetAlert.adaptInputValidator(inputValidator)
      }
      break

    default:
      error('Unexpected type of argument! Expected "string" or "object", got ' + typeof args[0])
      return false
  }

  setParameters(params)

  const domCache = context.domCache = {
    popup: dom.getPopup(),
    container: dom.getContainer(),
    content: dom.getContent(),
    actions: dom.getActions(),
    confirmButton: dom.getConfirmButton(),
    cancelButton: dom.getCancelButton(),
    closeButton: dom.getCloseButton(),
    validationError: dom.getValidationError(),
    progressSteps: dom.getProgressSteps()
  }

  return new Promise((resolve, reject) => {
    // functions to handle all resolving/rejecting/settling
    const succeedWith = (value) => {
      sweetAlert.closePopup(params.onClose)
      if (params.useRejections) {
        resolve(value)
      } else {
        resolve({value})
      }
    }
    const dismissWith = (dismiss) => {
      sweetAlert.closePopup(params.onClose)
      if (params.useRejections) {
        reject(dismiss)
      } else {
        resolve({dismiss})
      }
    }
    const errorWith = (error) => {
      sweetAlert.closePopup(params.onClose)
      reject(error)
    }

    // Close on timer
    if (params.timer) {
      domCache.popup.timeout = setTimeout(() => dismissWith('timer'), params.timer)
    }

    // Get the value of the popup input
    const getInputValue = () => {
      const input = sweetAlert.getInput()
      if (!input) {
        return null
      }
      switch (params.input) {
        case 'checkbox':
          return input.checked ? 1 : 0
        case 'radio':
          return input.checked ? input.value : null
        case 'file':
          return input.files.length ? input.files[0] : null
        default:
          return params.inputAutoTrim ? input.value.trim() : input.value
      }
    }

    // input autofocus
    if (params.input) {
      setTimeout(() => {
        const input = sweetAlert.getInput()
        if (input) {
          dom.focusInput(input)
        }
      }, 0)
    }

    const confirm = (value) => {
      if (params.showLoaderOnConfirm) {
        sweetAlert.showLoading()
      }

      if (params.preConfirm) {
        sweetAlert.resetValidationError()
        const preConfirmPromise = Promise.resolve().then(() => params.preConfirm(value, params.extraParams))
        if (params.expectRejections) {
          preConfirmPromise.then(
            (preConfirmValue) => succeedWith(preConfirmValue || value),
            (validationError) => {
              sweetAlert.hideLoading()
              if (validationError) {
                sweetAlert.showValidationError(validationError)
              }
            }
          )
        } else {
          preConfirmPromise.then(
            (preConfirmValue) => {
              if (dom.isVisible(domCache.validationError) || preConfirmValue === false) {
                sweetAlert.hideLoading()
              } else {
                succeedWith(preConfirmValue || value)
              }
            },
            (error) => errorWith(error)
          )
        }
      } else {
        succeedWith(value)
      }
    }

    // Mouse interactions
    const onButtonEvent = (event) => {
      const e = event || window.event
      const target = e.target || e.srcElement
      const {confirmButton, cancelButton} = domCache
      const targetedConfirm = confirmButton && (confirmButton === target || confirmButton.contains(target))
      const targetedCancel = cancelButton && (cancelButton === target || cancelButton.contains(target))

      switch (e.type) {
        case 'click':
          // Clicked 'confirm'
          if (targetedConfirm && sweetAlert.isVisible()) {
            sweetAlert.disableButtons()
            if (params.input) {
              const inputValue = getInputValue()

              if (params.inputValidator) {
                sweetAlert.disableInput()
                const validationPromise = Promise.resolve().then(() => params.inputValidator(inputValue, params.extraParams))
                if (params.expectRejections) {
                  validationPromise.then(
                    () => {
                      sweetAlert.enableButtons()
                      sweetAlert.enableInput()
                      confirm(inputValue)
                    },
                    (validationError) => {
                      sweetAlert.enableButtons()
                      sweetAlert.enableInput()
                      if (validationError) {
                        sweetAlert.showValidationError(validationError)
                      }
                    }
                  )
                } else {
                  validationPromise.then(
                    (validationError) => {
                      sweetAlert.enableButtons()
                      sweetAlert.enableInput()
                      if (validationError) {
                        sweetAlert.showValidationError(validationError)
                      } else {
                        confirm(inputValue)
                      }
                    },
                    error => errorWith(error)
                  )
                }
              } else {
                confirm(inputValue)
              }
            } else {
              confirm(true)
            }

          // Clicked 'cancel'
          } else if (targetedCancel && sweetAlert.isVisible()) {
            sweetAlert.disableButtons()
            dismissWith(sweetAlert.DismissReason.cancel)
          }
          break
        default:
      }
    }

    const buttons = domCache.popup.querySelectorAll('button')
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].onclick = onButtonEvent
      buttons[i].onmouseover = onButtonEvent
      buttons[i].onmouseout = onButtonEvent
      buttons[i].onmousedown = onButtonEvent
    }

    // Closing popup by close button
    domCache.closeButton.onclick = () => {
      dismissWith(sweetAlert.DismissReason.close)
    }

    if (params.toast) {
      // Closing popup by backdrop click
      domCache.popup.onclick = (e) => {
        if (e.target !== domCache.popup || (params.showConfirmButton || params.showCancelButton)) {
          return
        }
        if (params.allowOutsideClick) {
          sweetAlert.closePopup(params.onClose)
          dismissWith(sweetAlert.DismissReason.backdrop)
        }
      }
    } else {
      let ignoreOutsideClick = false

      // Ignore click events that had mousedown on the popup but mouseup on the container
      // This can happen when the user drags a slider
      domCache.popup.onmousedown = () => {
        domCache.container.onmouseup = function (e) {
          domCache.container.onmouseup = undefined
          // We only check if the mouseup target is the container because usually it doesn't
          // have any other direct children aside of the popup
          if (e.target === domCache.container) {
            ignoreOutsideClick = true
          }
        }
      }

      // Ignore click events that had mousedown on the container but mouseup on the popup
      domCache.container.onmousedown = () => {
        domCache.popup.onmouseup = function (e) {
          domCache.popup.onmouseup = undefined
          // We also need to check if the mouseup target is a child of the popup
          if (e.target === domCache.popup || domCache.popup.contains(e.target)) {
            ignoreOutsideClick = true
          }
        }
      }

      domCache.container.onclick = (e) => {
        if (ignoreOutsideClick) {
          ignoreOutsideClick = false
          return
        }
        if (e.target !== domCache.container) {
          return
        }
        if (callIfFunction(params.allowOutsideClick)) {
          dismissWith(sweetAlert.DismissReason.backdrop)
        }
      }
    }

    // Reverse buttons (Confirm on the right side)
    if (params.reverseButtons) {
      domCache.confirmButton.parentNode.insertBefore(domCache.cancelButton, domCache.confirmButton)
    } else {
      domCache.confirmButton.parentNode.insertBefore(domCache.confirmButton, domCache.cancelButton)
    }

    // Focus handling
    const setFocus = (index, increment) => {
      const focusableElements = dom.getFocusableElements(params.focusCancel)
      // search for visible elements and select the next possible match
      for (let i = 0; i < focusableElements.length; i++) {
        index = index + increment

        // rollover to first item
        if (index === focusableElements.length) {
          index = 0

        // go to last item
        } else if (index === -1) {
          index = focusableElements.length - 1
        }

        // determine if element is visible
        const el = focusableElements[index]
        if (dom.isVisible(el)) {
          return el.focus()
        }
      }
    }

    const handleKeyDown = (event) => {
      const e = event || window.event

      const arrowKeys = [
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Left', 'Right', 'Up', 'Down' // IE11
      ]

      if (e.key === 'Enter' && !e.isComposing) {
        if (e.target === sweetAlert.getInput()) {
          if (['textarea', 'file'].includes(params.input)) {
            return // do not submit
          }

          sweetAlert.clickConfirm()
          e.preventDefault()
        }

      // TAB
      } else if (e.key === 'Tab') {
        const targetElement = e.target || e.srcElement

        const focusableElements = dom.getFocusableElements(params.focusCancel)
        let btnIndex = -1 // Find the button - note, this is a nodelist, not an array.
        for (let i = 0; i < focusableElements.length; i++) {
          if (targetElement === focusableElements[i]) {
            btnIndex = i
            break
          }
        }

        if (!e.shiftKey) {
          // Cycle to the next button
          setFocus(btnIndex, 1)
        } else {
          // Cycle to the prev button
          setFocus(btnIndex, -1)
        }
        e.stopPropagation()
        e.preventDefault()

      // ARROWS - switch focus between buttons
      } else if (arrowKeys.includes(e.key)) {
        // focus Cancel button if Confirm button is currently focused
        if (document.activeElement === domCache.confirmButton && dom.isVisible(domCache.cancelButton)) {
          domCache.cancelButton.focus()
        // and vice versa
        } else if (document.activeElement === domCache.cancelButton && dom.isVisible(domCache.confirmButton)) {
          domCache.confirmButton.focus()
        }

      // ESC
      } else if ((e.key === 'Escape' || e.key === 'Esc') && callIfFunction(params.allowEscapeKey) === true) {
        dismissWith(sweetAlert.DismissReason.esc)
      }
    }

    if (params.toast && windowOnkeydownOverridden) {
      window.onkeydown = previousWindowKeyDown
      windowOnkeydownOverridden = false
    }

    if (!params.toast && !windowOnkeydownOverridden) {
      previousWindowKeyDown = window.onkeydown
      windowOnkeydownOverridden = true
      window.onkeydown = handleKeyDown
    }

    sweetAlert.enableButtons()
    sweetAlert.hideLoading()
    sweetAlert.resetValidationError()

    if (params.input) {
      dom.addClass(document.body, swalClasses['has-input'])
    }

    // inputs
    const inputTypes = ['input', 'file', 'range', 'select', 'radio', 'checkbox', 'textarea']
    let input
    for (let i = 0; i < inputTypes.length; i++) {
      const inputClass = swalClasses[inputTypes[i]]
      const inputContainer = dom.getChildByClass(domCache.content, inputClass)
      input = sweetAlert.getInput(inputTypes[i])

      // set attributes
      if (input) {
        for (let j in input.attributes) {
          if (input.attributes.hasOwnProperty(j)) {
            const attrName = input.attributes[j].name
            if (attrName !== 'type' && attrName !== 'value') {
              input.removeAttribute(attrName)
            }
          }
        }
        for (let attr in params.inputAttributes) {
          input.setAttribute(attr, params.inputAttributes[attr])
        }
      }

      // set class
      inputContainer.className = inputClass
      if (params.inputClass) {
        dom.addClass(inputContainer, params.inputClass)
      }

      dom.hide(inputContainer)
    }

    let populateInputOptions
    switch (params.input) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'tel':
      case 'url':
        input = dom.getChildByClass(domCache.content, swalClasses.input)
        input.value = params.inputValue
        input.placeholder = params.inputPlaceholder
        input.type = params.input
        dom.show(input)
        break
      case 'file':
        input = dom.getChildByClass(domCache.content, swalClasses.file)
        input.placeholder = params.inputPlaceholder
        input.type = params.input
        dom.show(input)
        break
      case 'range':
        const range = dom.getChildByClass(domCache.content, swalClasses.range)
        const rangeInput = range.querySelector('input')
        const rangeOutput = range.querySelector('output')
        rangeInput.value = params.inputValue
        rangeInput.type = params.input
        rangeOutput.value = params.inputValue
        dom.show(range)
        break
      case 'select':
        const select = dom.getChildByClass(domCache.content, swalClasses.select)
        select.innerHTML = ''
        if (params.inputPlaceholder) {
          const placeholder = document.createElement('option')
          placeholder.innerHTML = params.inputPlaceholder
          placeholder.value = ''
          placeholder.disabled = true
          placeholder.selected = true
          select.appendChild(placeholder)
        }
        populateInputOptions = (inputOptions) => {
          inputOptions.forEach(([optionValue, optionLabel]) => {
            const option = document.createElement('option')
            option.value = optionValue
            option.innerHTML = optionLabel
            if (params.inputValue.toString() === optionValue.toString()) {
              option.selected = true
            }
            select.appendChild(option)
          })
          dom.show(select)
          select.focus()
        }
        break
      case 'radio':
        const radio = dom.getChildByClass(domCache.content, swalClasses.radio)
        radio.innerHTML = ''
        populateInputOptions = (inputOptions) => {
          inputOptions.forEach(([radioValue, radioLabel]) => {
            const radioInput = document.createElement('input')
            const radioLabelElement = document.createElement('label')
            radioInput.type = 'radio'
            radioInput.name = swalClasses.radio
            radioInput.value = radioValue
            if (params.inputValue.toString() === radioValue.toString()) {
              radioInput.checked = true
            }
            radioLabelElement.innerHTML = radioLabel
            radioLabelElement.insertBefore(radioInput, radioLabelElement.firstChild)
            radio.appendChild(radioLabelElement)
          })
          dom.show(radio)
          const radios = radio.querySelectorAll('input')
          if (radios.length) {
            radios[0].focus()
          }
        }
        break
      case 'checkbox':
        const checkbox = dom.getChildByClass(domCache.content, swalClasses.checkbox)
        const checkboxInput = sweetAlert.getInput('checkbox')
        checkboxInput.type = 'checkbox'
        checkboxInput.value = 1
        checkboxInput.id = swalClasses.checkbox
        checkboxInput.checked = Boolean(params.inputValue)
        let label = checkbox.getElementsByTagName('span')
        if (label.length) {
          checkbox.removeChild(label[0])
        }
        label = document.createElement('span')
        label.innerHTML = params.inputPlaceholder
        checkbox.appendChild(label)
        dom.show(checkbox)
        break
      case 'textarea':
        const textarea = dom.getChildByClass(domCache.content, swalClasses.textarea)
        textarea.value = params.inputValue
        textarea.placeholder = params.inputPlaceholder
        dom.show(textarea)
        break
      case null:
        break
      default:
        error(`Unexpected type of input! Expected "text", "email", "password", "number", "tel", "select", "radio", "checkbox", "textarea", "file" or "url", got "${params.input}"`)
        break
    }

    if (params.input === 'select' || params.input === 'radio') {
      const processInputOptions = inputOptions => populateInputOptions(formatInputOptions(inputOptions))
      if (params.inputOptions instanceof Promise) {
        sweetAlert.showLoading()
        params.inputOptions.then((inputOptions) => {
          sweetAlert.hideLoading()
          processInputOptions(inputOptions)
        })
      } else if (typeof params.inputOptions === 'object') {
        processInputOptions(params.inputOptions)
      } else {
        error('Unexpected type of inputOptions! Expected object, Map or Promise, got ' + typeof params.inputOptions)
      }
    }

    openPopup(params.animation, params.onBeforeOpen, params.onOpen)

    if (!params.toast) {
      if (!callIfFunction(params.allowEnterKey)) {
        if (document.activeElement) {
          document.activeElement.blur()
        }
      } else if (params.focusCancel && dom.isVisible(domCache.cancelButton)) {
        domCache.cancelButton.focus()
      } else if (params.focusConfirm && dom.isVisible(domCache.confirmButton)) {
        domCache.confirmButton.focus()
      } else {
        setFocus(-1, 1)
      }
    }

    // fix scroll
    domCache.container.scrollTop = 0
  })
}

/*
 * Global function to determine if swal2 popup is shown
 */
sweetAlert.isVisible = () => {
  return !!dom.getPopup()
}

/*
 * Global function for chaining sweetAlert popups
 */
sweetAlert.queue = (steps) => {
  queue = steps
  const resetQueue = () => {
    queue = []
    document.body.removeAttribute('data-swal2-queue-step')
  }
  let queueResult = []
  return new Promise((resolve, reject) => {
    (function step (i, callback) {
      if (i < queue.length) {
        document.body.setAttribute('data-swal2-queue-step', i)

        sweetAlert(queue[i]).then((result) => {
          if (typeof result.value !== 'undefined') {
            queueResult.push(result.value)
            step(i + 1, callback)
          } else {
            resetQueue()
            resolve({dismiss: result.dismiss})
          }
        })
      } else {
        resetQueue()
        resolve({value: queueResult})
      }
    })(0)
  })
}

/*
 * Global function for getting the index of current popup in queue
 */
sweetAlert.getQueueStep = () => document.body.getAttribute('data-swal2-queue-step')

/*
 * Global function for inserting a popup to the queue
 */
sweetAlert.insertQueueStep = (step, index) => {
  if (index && index < queue.length) {
    return queue.splice(index, 0, step)
  }
  return queue.push(step)
}

/*
 * Global function for deleting a popup from the queue
 */
sweetAlert.deleteQueueStep = (index) => {
  if (typeof queue[index] !== 'undefined') {
    queue.splice(index, 1)
  }
}

/*
 * Global function to close sweetAlert
 */
sweetAlert.close = sweetAlert.closePopup = sweetAlert.closeModal = sweetAlert.closeToast = (onComplete) => {
  const container = dom.getContainer()
  const popup = dom.getPopup()
  if (!popup) {
    return
  }
  dom.removeClass(popup, swalClasses.show)
  dom.addClass(popup, swalClasses.hide)
  clearTimeout(popup.timeout)

  if (!dom.isToast()) {
    dom.resetPrevState()
    window.onkeydown = previousWindowKeyDown
    windowOnkeydownOverridden = false
  }

  const removePopupAndResetState = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
    dom.removeClass(
      [document.documentElement, document.body],
      [
        swalClasses.shown,
        swalClasses['no-backdrop'],
        swalClasses['has-input'],
        swalClasses['toast-shown']
      ]
    )

    if (dom.isModal()) {
      undoScrollbar()
      undoIOSfix()
    }
  }

  // If animation is supported, animate
  if (dom.animationEndEvent && !dom.hasClass(popup, swalClasses.noanimation)) {
    popup.addEventListener(dom.animationEndEvent, function swalCloseEventFinished () {
      popup.removeEventListener(dom.animationEndEvent, swalCloseEventFinished)
      if (dom.hasClass(popup, swalClasses.hide)) {
        removePopupAndResetState()
      }
    })
  } else {
    // Otherwise, remove immediately
    removePopupAndResetState()
  }
  if (onComplete !== null && typeof onComplete === 'function') {
    setTimeout(() => {
      onComplete(popup)
    })
  }
}

/*
 * Global function to click 'Confirm' button
 */
sweetAlert.clickConfirm = () => dom.getConfirmButton().click()

/*
 * Global function to click 'Cancel' button
 */
sweetAlert.clickCancel = () => dom.getCancelButton().click()

/**
 * Show spinner instead of Confirm button and disable Cancel button
 */
sweetAlert.showLoading = sweetAlert.enableLoading = () => {
  let popup = dom.getPopup()
  if (!popup) {
    sweetAlert('')
  }
  popup = dom.getPopup()
  const actions = dom.getActions()
  const confirmButton = dom.getConfirmButton()
  const cancelButton = dom.getCancelButton()

  dom.show(actions)
  dom.show(confirmButton)
  dom.addClass([popup, actions], swalClasses.loading)
  confirmButton.disabled = true
  cancelButton.disabled = true

  popup.setAttribute('data-loading', true)
  popup.setAttribute('aria-busy', true)
  popup.focus()
}

/**
 * Is valid parameter
 * @param {String} paramName
 */
sweetAlert.isValidParameter = (paramName) => {
  return defaultParams.hasOwnProperty(paramName) || paramName === 'extraParams'
}

/**
 * Is deprecated parameter
 * @param {String} paramName
 */
sweetAlert.isDeprecatedParameter = (paramName) => {
  return deprecatedParams.includes(paramName)
}

/**
 * Set default params for each popup
 * @param {Object} userParams
 */
sweetAlert.setDefaults = (userParams) => {
  if (!userParams || typeof userParams !== 'object') {
    return error('the argument for setDefaults() is required and has to be a object')
  }

  showWarningsForParams(userParams)

  // assign valid params from userParams to popupParams
  for (const param in userParams) {
    if (sweetAlert.isValidParameter(param)) {
      popupParams[param] = userParams[param]
    }
  }
}

/**
 * Reset default params for each popup
 */
sweetAlert.resetDefaults = () => {
  popupParams = Object.assign({}, defaultParams)
}

/**
 * Adapt a legacy inputValidator for use with expectRejections=false
 */
sweetAlert.adaptInputValidator = (legacyValidator) => {
  return function adaptedInputValidator (inputValue, extraParams) {
    return legacyValidator.call(this, inputValue, extraParams)
      .then(() => undefined, validationError => validationError)
  }
}

sweetAlert.getTitle = () => dom.getTitle()
sweetAlert.getContent = () => dom.getContent()
sweetAlert.getImage = () => dom.getImage()
sweetAlert.getButtonsWrapper = () => dom.getButtonsWrapper()
sweetAlert.getActions = () => dom.getActions()
sweetAlert.getConfirmButton = () => dom.getConfirmButton()
sweetAlert.getCancelButton = () => dom.getCancelButton()
sweetAlert.getFooter = () => dom.getFooter()
sweetAlert.isLoading = () => dom.isLoading()

/**
 * Show spinner instead of Confirm button and disable Cancel button
 */
sweetAlert.hideLoading = sweetAlert.disableLoading = () => {
  if (currentContext) {
    const {params, domCache} = currentContext
    if (!params.showConfirmButton) {
      dom.hide(domCache.confirmButton)
      if (!params.showCancelButton) {
        dom.hide(domCache.actions)
      }
    }
    dom.removeClass([domCache.popup, domCache.actions], swalClasses.loading)
    domCache.popup.removeAttribute('aria-busy')
    domCache.popup.removeAttribute('data-loading')
    domCache.confirmButton.disabled = false
    domCache.cancelButton.disabled = false
  }
}

// Get input element by specified type or, if type isn't specified, by params.input
sweetAlert.getInput = (inputType) => {
  if (currentContext) {
    const {params, domCache} = currentContext
    inputType = inputType || params.input
    if (!inputType) {
      return null
    }
    switch (inputType) {
      case 'select':
      case 'textarea':
      case 'file':
        return dom.getChildByClass(domCache.content, swalClasses[inputType])
      case 'checkbox':
        return domCache.popup.querySelector(`.${swalClasses.checkbox} input`)
      case 'radio':
        return domCache.popup.querySelector(`.${swalClasses.radio} input:checked`) ||
          domCache.popup.querySelector(`.${swalClasses.radio} input:first-child`)
      case 'range':
        return domCache.popup.querySelector(`.${swalClasses.range} input`)
      default:
        return dom.getChildByClass(domCache.content, swalClasses.input)
    }
  }
}

sweetAlert.enableButtons = () => {
  if (currentContext) {
    const {domCache} = currentContext
    domCache.confirmButton.disabled = false
    domCache.cancelButton.disabled = false
  }
}

sweetAlert.disableButtons = () => {
  if (currentContext) {
    const {domCache} = currentContext
    domCache.confirmButton.disabled = true
    domCache.cancelButton.disabled = true
  }
}

sweetAlert.enableConfirmButton = () => {
  if (currentContext) {
    const {domCache} = currentContext
    domCache.confirmButton.disabled = false
  }
}

sweetAlert.disableConfirmButton = () => {
  if (currentContext) {
    const {domCache} = currentContext
    domCache.confirmButton.disabled = true
  }
}

sweetAlert.enableInput = () => {
  if (currentContext) {
    const input = sweetAlert.getInput()
    if (!input) {
      return false
    }
    if (input.type === 'radio') {
      const radiosContainer = input.parentNode.parentNode
      const radios = radiosContainer.querySelectorAll('input')
      for (let i = 0; i < radios.length; i++) {
        radios[i].disabled = false
      }
    } else {
      input.disabled = false
    }
  }
}

sweetAlert.disableInput = () => {
  if (currentContext) {
    const input = sweetAlert.getInput()
    if (!input) {
      return false
    }
    if (input && input.type === 'radio') {
      const radiosContainer = input.parentNode.parentNode
      const radios = radiosContainer.querySelectorAll('input')
      for (let i = 0; i < radios.length; i++) {
        radios[i].disabled = true
      }
    } else {
      input.disabled = true
    }
  }
}

// Show block with validation error
sweetAlert.showValidationError = (error) => {
  if (currentContext) {
    const {domCache} = currentContext
    domCache.validationError.innerHTML = error
    const popupComputedStyle = window.getComputedStyle(domCache.popup)
    domCache.validationError.style.marginLeft = `-${popupComputedStyle.getPropertyValue('padding-left')}`
    domCache.validationError.style.marginRight = `-${popupComputedStyle.getPropertyValue('padding-right')}`
    dom.show(domCache.validationError)

    const input = sweetAlert.getInput()
    if (input) {
      input.setAttribute('aria-invalid', true)
      input.setAttribute('aria-describedBy', swalClasses.validationerror)
      dom.focusInput(input)
      dom.addClass(input, swalClasses.inputerror)
    }
  }
}

// Hide block with validation error
sweetAlert.resetValidationError = () => {
  if (currentContext) {
    const {domCache} = currentContext
    if (domCache.validationError) {
      dom.hide(domCache.validationError)
    }

    const input = sweetAlert.getInput()
    if (input) {
      input.removeAttribute('aria-invalid')
      input.removeAttribute('aria-describedBy')
      dom.removeClass(input, swalClasses.inputerror)
    }
  }
}

sweetAlert.getProgressSteps = () => {
  if (currentContext) {
    const {params} = currentContext
    return params.progressSteps
  }
}

sweetAlert.setProgressSteps = (progressSteps) => {
  if (currentContext) {
    const {params} = currentContext
    params.progressSteps = progressSteps
    setParameters(params)
  }
}

sweetAlert.showProgressSteps = () => {
  if (currentContext) {
    const {domCache} = currentContext
    dom.show(domCache.progressSteps)
  }
}

sweetAlert.hideProgressSteps = () => {
  if (currentContext) {
    const {domCache} = currentContext
    dom.hide(domCache.progressSteps)
  }
}

sweetAlert.DismissReason = Object.freeze({
  cancel: 'cancel',
  backdrop: 'overlay',
  close: 'close',
  esc: 'esc',
  timer: 'timer'
})

sweetAlert.noop = () => { }

sweetAlert.version = ''

sweetAlert.default = sweetAlert

/**
 * Set default params if `window._swalDefaults` is an object
 */
if (typeof window !== 'undefined' && typeof window._swalDefaults === 'object') {
  sweetAlert.setDefaults(window._swalDefaults)
}

export default sweetAlert
