export default function allowedHostsPlugin() {
  return {
    name: 'allowed-hosts',
    configureServer(server) {
      const originalListen = server.listen
      server.listen = function(...args) {
        const result = originalListen.apply(this, args)
        
        // Override the allowedHosts check
        const originalCheckHost = server.middlewares.stack.find(
          layer => layer.handle && layer.handle.name === 'allowedHostsMiddleware'
        )
        
        if (originalCheckHost) {
          const index = server.middlewares.stack.indexOf(originalCheckHost)
          server.middlewares.stack.splice(index, 1)
        }
        
        return result
      }
    }
  }
}