import axios from "axios"
import Immutable from 'immutable'

class SaveBehavior {
  constructor(options) {
    this.getLocks = options.getLocks
    this.config = options.config
    this.editorContent = options.editorContent
    this.editorState = options.editorState
  }

  handleStore(ev){
    return this.store()
  }

  store(content){
    if (!this.config.data_storage.url) { return }
    if (this.getLocks() > 0) { return }

    clearTimeout(this.timeout)

    return this.timeout = setTimeout(() => {
      return this.checkforStore(content)
    }
    , this.config.data_storage.interval)
  }

  getTextFromEditor(content){
    return content.blocks.map(o=> {
        return o.text
      }
    )
      .join("\n")
  }

  getUrl() {
    let { url } = this.config.data_storage
    if (typeof(url) === "function") { return url() } else { return url }
  }

  getMethod() {
    let { method } = this.config.data_storage
    if (typeof(method) === "function") { return method() } else { return method }
  }


  checkforStore(content){
    // ENTER DATA STORE
    let isChanged = !Immutable.is(Immutable.fromJS(this.editorContent), Immutable.fromJS(content))
    // console.log("CONTENT CHANGED:", isChanged)

    if (!isChanged) { return }

    if (this.config.xhr.before_handler) { this.config.xhr.before_handler() }
    // console.log "SAVING TO: #{@getMethod()} #{@getUrl()}"

    return axios({
      method: this.getMethod(),
      url: this.getUrl(),
      data: {
        editor_content: JSON.stringify(content),
        text_content: this.getTextFromEditor(content)
      }
    })
    .then(result=> {
      // console.log "STORING CONTENT", result
      if (this.config.data_storage.success_handler) { this.config.data_storage.success_handler(result) }
      if (this.config.xhr.success_handler) { return this.config.xhr.success_handler(result) }
    }
    )
    .catch(error=> {
      // console.log("ERROR: got error saving content at #{@config.data_storage.url} - #{error}")
      if (this.config.xhr.failure_handler) { return this.config.xhr.failure_handler(error) }
    }
    )
  }
}


export default SaveBehavior
