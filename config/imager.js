module.exports = {
  variants: {
    article: {
      resize: {
        med: "800x600",
        org: "100%"
      },
      crop: {
        
      },
      thumbnail: {
        better_thumb_center: "100x100 Center"
      }
    },
    user: {
      resize: {
        user_thumb: "250x250"
      },
      crop: {
        
      },
      resizeAndCrop: {
      }
    }
  },
  storage: {
    Rackspace: {
      auth: {
        username: "USERNAME",
        apiKey: "API_KEY",
        host: "lon.auth.api.rackspacecloud.com"
      },
      container: "CONTAINER_NAME"
    },
    S3: {
      key: 'AKIAJMVXXC2LK6KGWGIQ',
      secret: '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',
      bucket: 'img.tryphoton.com',
     // region: 'US Standard'
    }
  },

  debug: false
}
