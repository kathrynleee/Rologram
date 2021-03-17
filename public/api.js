const getVersions = async () => {
  try {
      return await axios.get( '/api/data/versions')
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

const getSystemChangesList = async (v) => {
  try {
      return await axios.get(`/api/data/changes/system/${selectedVersion}/${v}`)
  } catch (e) {
      console.error(e)
  }
}

const getPackageChangesList = async (v) => {
  try {
      return await axios.get(`/api/data/changes/package/${selectedVersion}/${v}/${selectedPackage}`)
  } catch (e) {
      console.error(e)
  }
}

const getClassChangesList = async (v) => {
  try {
      return await axios.get(`/api/data/changes/class/${selectedVersion}/${v}/${selectedClass}`)
  } catch (e) {
      console.error(e)
  }
}