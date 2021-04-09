'use strict'

const getVersions = async () => {
  try {
      return await axios.get( '/api/data/versions')
  } catch (e) {
      console.error(e)
  }
}

const getUsername = async () => {
  try {
      return await axios.get('/api/data/username')
  } catch (e) {
      console.error(e)
  }
}

const getPath = async (version, id) => {
  try {
      return await axios.get(`/api/data/path/${version}/${id}`)
  } catch (e) {
      console.error(e)
  }
}

const getAllElements = async () => {
  try {
    return await axios.get('/api/data/elements')
  } catch (e) {
    console.error(e)
  }
}

const getElements = async (version) => {
  try {
    return await axios.get(`/api/data/elements/${version}`)
  } catch (e) {
    console.error(e)
  }
}

const getStyles = async () => {
  try {
    return await axios.get( '/api/data/styles')
  } catch (e) {
    console.error(e)
  }
}

const getSystemRoleList = async () => {
  try {
    return await axios.get('/api/data/roles/versions')
  } catch (e) {
    console.error(e)
  }
}

const getPackageRoleList = async (id) => {
  try {
    return await axios.get(`/api/data/roles/package/${id}`)
  } catch (e) {
    console.error(e)
  }
}

const getClassRoleList = async (id) => {
  try {
    return await axios.get(`/api/data/roles/${id}`)
  } catch (e) {
    console.error(e)
  }
}

const getSystemChangesList = async (current, compare) => {
  try {
    return await axios.get(`/api/data/changes/system/${current}/${compare}`)
  } catch (e) {
    console.error(e)
  }
}

const getPackageChangesList = async (current, compare) => {
  try {
    return await axios.get(`/api/data/changes/package/${current}/${compare}/${selectedPackage}`)
  } catch (e) {
    console.error(e)
  }
}

const getClassChangesList = async (current, compare) => {
  try {
    return await axios.get(`/api/data/changes/class/${current}/${compare}/${selectedClass}`)
  } catch (e) {
    console.error(e)
  }
}

const getSourceCode = async (url) => {
  try {
    return await axios.get(url)
  } catch (e) {
    // console.error(e)
  }
}