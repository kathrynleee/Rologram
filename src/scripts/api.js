'use strict'

import { baseURL, get, post } from 'axios'
baseURL = 'localhost:3000'

let Api = {
  async getVersions() {
    try {
      return await get( '/api/data/versions')
    } catch (e) {
      console.error(e)
    }
  },

  async getUsername() {
    try {
      return await get('/api/data/username')
    } catch (e) {
      console.error(e)
    }
  },

  async getPath(version, id) {
    try {
      return await get(`/api/data/path/${version}/${id}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getAllElements() {
    try {
      return await get('/api/data/elements')
    } catch (e) {
      console.error(e)
    }
  },

  async getElements(version) {
    try {
      return await get(`/api/data/elements/${version}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getStyles() {
    try {
      return await get( '/api/data/styles')
    } catch (e) {
      console.error(e)
    }
  },

  async getSystemRoleList() {
    try {
      return await get('/api/data/roles/versions')
    } catch (e) {
      console.error(e)
    }
  },

  async getPackageRoleList(id) {
    try {
      return await get(`/api/data/roles/package/${id}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getClassRoleList(id) {
    try {
      return await get(`/api/data/roles/${id}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getSystemChangesList(current, compare) {
    try {
      return await get(`/api/data/changes/system/${current}/${compare}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getPackageChangesList(current, compare, selectedPackage) {
    try {
      return await get(`/api/data/changes/package/${current}/${compare}/${selectedPackage}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getClassChangesList(current, compare, selectedClass) {
    try {
      return await get(`/api/data/changes/class/${current}/${compare}/${selectedClass}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getSourceCode(url) {
    return await get(url)
  },

  async getRoleChangedClass(version) {
    try {
      return await get(`/api/data/roleChanged/${version}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getRankingList(level, version) {
    try {
      return await get(`/api/data/pattern/${level}/${version}`)
    } catch (e) {
      console.error(e)
    }
  },

  async getPatternData(level, options) {
    try {
      return await post('/api/data/pattern', { level: level, options: options })
    } catch (e) {
      console.error(e)
    }
  }
}

export default Api