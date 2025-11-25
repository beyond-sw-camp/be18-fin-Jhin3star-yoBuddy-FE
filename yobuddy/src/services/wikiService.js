import http from '@/services/http'

const PATH = '/api/v1/wiki'

const wikiService = {
  // get all wiki nodes (expected to return tree-structured array)
  getAll() {
    return http.get(PATH)
  },

  // get single node by id
  get(id) {
    return http.get(`${PATH}/${id}`)
  },

  // create a node; payload should include title, content, parentId (nullable), depth optional
  create(payload) {
    return http.post(PATH, payload)
  },

  // update node by id
  update(id, payload) {
    return http.patch(`${PATH}/${id}`, payload)
  },

  // delete node by id
  remove(id) {
    return http.delete(`${PATH}/${id}`)
  }
}

export default wikiService
