const buildSingleValueCallback = (prompt) => ({
  data: {
    authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkRXUC1SZWdpc3RyYXRpb24iLCJvdGsiOiJka3IxMW9nODZpNmRnaGdzMW9nY2swN2F1IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9DaXRpemVucyIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ERUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFBKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1WFZGTkhjMXBzT1VsellVNHlUbU5xYkdJeE9YRm5MazFsWVdaNVZIQnVaMmxMTm1sSFdYZFpVWFJWWWtwNlRXSllOR2hXU1RkSFRrVnVkbmt0V1dveU9ISkJNRlZ2ZVVwM01YSmpkbTFrU1ZSR09VZHliVEpaVG13d1VrbDVWV3hhVERjNFQxSkpSVUpUY1ZoWGRFTTBaWFJNY0hKMFpGVmZUMHhzY205RExYUkplRWxIWTBONFJFdG5Xa2RrTm5KNFJGUllUSEpLUW1Wd1MzZ3hhV1J3Wkd0ZlVUTndlRnBaYTFkS1VVWTVXRzB4VUhaV1VraE5aSE53U2tGWVkxZFZPRWxHZHkxeVUyaEJlVXBDTWtOemMxTTVkVkowU0dKT1J6ZHFZelpyYm1wSk9EWXlhVlZyU0RCa1MzbFFhMFZUZDFkMWVWbzBTRnBEV0dScE9XTldjWGd3VjFSb1VsZGpOMU01Y25BMVNYUnJRbXBXYkhRM2RVWndhbko2ZURCWlpqSm1jbFIzVkhkeVNraE9NRkI1Vmpodll6SlFja2RCYW5aT00wWTVWakZRTkZCcGJFUkdSVzlPYjBSVWQxOWlkR2RVVjBKak5tWlRVVzV4V1dGU2QxVnFMV1JHTjFoNmVIZFZaR0ZDTTBoV1VqWkZMWFZNWkhreVVYUjZZbkV4TkhWeGVGTnZibW93ZDJjd1l6RlNaMFkwUkdoeFdtRndjVkJoVlcxT1gxVXlTMkpzVWpWV01YZHphMFpQYlc1WGJFNXJUMWw0YzBSVWNuZzFPQzFaVjJZeFJYUktUVU5pVWpJemFWODJjRmRGWVU5WFJWVmhOMWhuVkZCaGNEUlVkME4xVW5sTFFYb3Ria1pYVVV0VlVYaHRSbkJJVkdaRlVrUnhUbWd4UTBOdFlXbHpVV05rT0ZrdFZVSmlaazB5ZDFJMU1qRTBWbWhETlhORk1rNXpaMDR3UjNVelQyZElMVnA1WW1GdE9EZDJNR2hXWm14R2NXMDNORGhtWHpGeFlVZGlUek5ZYVZKbWVIRXlhelI1TVdrNU4wVnNhamxJUjJkRGRrVlNSVkJZVlRkellYQmFiMjlxWlVFdVgyMXpTblo2U0ZGWldYUXpTMDlNYkdOMlFtNVdady5DMzdBMm1RTjZtUjVrelNYaThVOWdNcDY4RkVVckNIVkRJZGlvMVFzTXdRIiwiZXhwIjoxNTkwOTU3MTIwLCJpYXQiOjE1OTA5NTY4MjB9.fygZDmqiUH12f_W0UROkv4yNl5CR7uEPE_EFiNZZj2k',
    callbacks: [
      {
        type: 'NameCallback',
        output: [
          {
            name: 'prompt',
            value: prompt,
          },
        ],
        input: [
          {
            name: 'IDToken1',
            value: '',
          },
        ],
      },
    ],
  },
});

const buildTwoValueCallback = (prompt1, prompt2) => ({
  data: {
    authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkRXUC1SZWdpc3RyYXRpb24iLCJvdGsiOiJka3IxMW9nODZpNmRnaGdzMW9nY2swN2F1IiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii9DaXRpemVucyIsInNlc3Npb25JZCI6IipBQUpUU1FBQ01ERUFCSFI1Y0dVQUNFcFhWRjlCVlZSSUFBSlRNUUFBKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1WFZGTkhjMXBzT1VsellVNHlUbU5xYkdJeE9YRm5MazFsWVdaNVZIQnVaMmxMTm1sSFdYZFpVWFJWWWtwNlRXSllOR2hXU1RkSFRrVnVkbmt0V1dveU9ISkJNRlZ2ZVVwM01YSmpkbTFrU1ZSR09VZHliVEpaVG13d1VrbDVWV3hhVERjNFQxSkpSVUpUY1ZoWGRFTTBaWFJNY0hKMFpGVmZUMHhzY205RExYUkplRWxIWTBONFJFdG5Xa2RrTm5KNFJGUllUSEpLUW1Wd1MzZ3hhV1J3Wkd0ZlVUTndlRnBaYTFkS1VVWTVXRzB4VUhaV1VraE5aSE53U2tGWVkxZFZPRWxHZHkxeVUyaEJlVXBDTWtOemMxTTVkVkowU0dKT1J6ZHFZelpyYm1wSk9EWXlhVlZyU0RCa1MzbFFhMFZUZDFkMWVWbzBTRnBEV0dScE9XTldjWGd3VjFSb1VsZGpOMU01Y25BMVNYUnJRbXBXYkhRM2RVWndhbko2ZURCWlpqSm1jbFIzVkhkeVNraE9NRkI1Vmpodll6SlFja2RCYW5aT00wWTVWakZRTkZCcGJFUkdSVzlPYjBSVWQxOWlkR2RVVjBKak5tWlRVVzV4V1dGU2QxVnFMV1JHTjFoNmVIZFZaR0ZDTTBoV1VqWkZMWFZNWkhreVVYUjZZbkV4TkhWeGVGTnZibW93ZDJjd1l6RlNaMFkwUkdoeFdtRndjVkJoVlcxT1gxVXlTMkpzVWpWV01YZHphMFpQYlc1WGJFNXJUMWw0YzBSVWNuZzFPQzFaVjJZeFJYUktUVU5pVWpJemFWODJjRmRGWVU5WFJWVmhOMWhuVkZCaGNEUlVkME4xVW5sTFFYb3Ria1pYVVV0VlVYaHRSbkJJVkdaRlVrUnhUbWd4UTBOdFlXbHpVV05rT0ZrdFZVSmlaazB5ZDFJMU1qRTBWbWhETlhORk1rNXpaMDR3UjNVelQyZElMVnA1WW1GdE9EZDJNR2hXWm14R2NXMDNORGhtWHpGeFlVZGlUek5ZYVZKbWVIRXlhelI1TVdrNU4wVnNhamxJUjJkRGRrVlNSVkJZVlRkellYQmFiMjlxWlVFdVgyMXpTblo2U0ZGWldYUXpTMDlNYkdOMlFtNVdady5DMzdBMm1RTjZtUjVrelNYaThVOWdNcDY4RkVVckNIVkRJZGlvMVFzTXdRIiwiZXhwIjoxNTkwOTU3MTIwLCJpYXQiOjE1OTA5NTY4MjB9.fygZDmqiUH12f_W0UROkv4yNl5CR7uEPE_EFiNZZj2k',
    callbacks: [
      {
        type: 'NameCallback',
        output: [
          {
            name: 'prompt',
            value: prompt1,
          },
        ],
        input: [
          {
            name: 'IDToken1',
            value: '',
          },
        ],
      },
      {
        type: 'NameCallback',
        output: [
          {
            name: 'prompt',
            value: prompt2,
          },
        ],
        input: [
          {
            name: 'IDToken2',
            value: '',
          },
        ],
      },
    ],
  },
});

const buildSuccessfulAuthenticationCallback = () => ({
  data: {
    tokenId: '3V3Yb-V0Lg8IQw3CrtYWR4ln5C4.*AAJTSQACMDIAAlNLABxXempNbmVhWWZNVHYrR3ppbXZRekRhV2ZielE9AAR0eXBlAANDVFMAAlMxAAIwMQ..*',
    successUrl: '/am/console',
    realm: '/Citizens',
  },
});

const buildOIDCRedirectCallback = () => ({
  response: {
    status: 302,
    headers: {
      location: 'http://localhost:3002/auth/callback?code=MZRHT2HS81itaiKc8KD_KlMf190&iss=https%3A%2F%2Frav.shefcon-dev.dwpcloud.uk%2Fam%2Foauth2%2FCitizens&state=h1JPP%2B1BH52icrLPqEWu%2Fom%2B&client_id=CxP',
    },
  },
});

const buildError401Callback = (errorMessage) => ({
  response: {
    data: {
      status: 401,
      message: 'Login failure',
      detail: {
        failureUrl: errorMessage,
      },
    },
    status: 401,
  },
  status: 401,
  message: 'Login failure',
});

const buildHTMLValueCallback = () => ({
  data: {
    authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkFhYVMtQXV0aGVudGljYXRpb24iLCJvdGsiOiJwNGJkOWUyZWptNTJyNnZoMnRtMzVmNHQ4OCIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvQ2l0aXplbnMvV0VCIiwic2Vzc2lvbklkIjoiKkFBSlRTUUFDTURJQUJIUjVjR1VBQ0VwWFZGOUJWVlJJQUFKVE1RQUNNREUuKmV5SjBlWEFpT2lKS1YxUWlMQ0pqZEhraU9pSktWMVFpTENKaGJHY2lPaUpJVXpJMU5pSjkuWlhsS01HVllRV2xQYVVwTFZqRlJhVXhEU214aWJVMXBUMmxLUWsxVVNUUlJNRXBFVEZWb1ZFMXFWVEpKYVhkcFdWZDRia2xxYjJsYVIyeDVTVzR3TGk1U1ZVTXlkemRvYTJzMGFEVjNkMlZVTkU1NldsOTNMa0Z1TFVSeU5FMU5NRjlVWWxONlJsODFkR2xIV25CeFpDMDVXVFV5VmxaMGFVbG9WV1ZFUkRWNFdXdE1OUzFSZEhsTGVtdGZNMGhmVFVvMlIyOHRaSEIwZFRCS2FXZE9OalIyWkdwSGJYZHdhakJMVWtwSk1FNDRWVVJTZW05blEyTlFhR1JMYjFkU1VVeFFXSFYyU0VSeWVrTjBTRkoyVXpOaVlqUktNVVl0Wmpaa2NXSlhNRTkwUVZGbVYwSTBWbFZXTkZkTlJGUnhOMHR5UkVWM2ExTkNPR2N4Y1hwQk5USm9Ra0pGUVhNeE16SkNUSFkyTTBScE5XVmZUVkY1TkRKTlMzTmpVVGsxVm14UWQxSmplV2hhYjBsUk5GVlBUR2x4TkVoRGFuSnZSMWxVYlhSWVNUTTBVMHhpZVVkeGJFdFpRbHBDTW10cVRtUk1ha0l4UTFKMlpXbDJPVjh4ZERWd2NVMTZNa3BtVGpkNloySldhR3QyT0VSS1ZtdzRTR1JrUkdkamVHTTRla042UWxWT1pHRXRTVTExUkhoeGRuaENaRWhVU21oWWNreERWRkJ0VW5CTGNsa3RlWEZwT1RjdFExcGllakZRWWtsNFJqRlBPVEF5TVZwWVVHVnpjMHc0UjBJMFVHeGtWMkZFYW1WZlJrRm9lSG8wT1VScU1tcFNiRVJWV0cxeU1IVnlRbGwyVjJSTVlVbHhURlp3YTI1R1ZWOWZZMVp0VGpkSFdIZGZhSGczVG1SQ2JqZ3RVR05zU0Y5SFRFNURWemx4YW5SNGNYUjRaMHBPYkhGd1pHRjZaaTFmWjNsbU5YRjZaalk1WkVSVldIUlNSakZGVG1wblZuTmZNbVV6Y1hRMU5rSlRRMUpzUXpGcWJGUlZPVmxYZGt0ak1HOTJNVGxDYlZreGQwWjBWVk5tTTBKQk4zSjJRbkZwUjFwaFoxTTRZV1JuZFhKbVNHWlZObWRSZERWMWNuTXhObmRZTWxwcGNFNTRWMWMyWXpCbGJtMW5WRkJ4VWxwUWIzcHlObE5DZUhKclRtVXdTMHRNY1c5UlJ5MHRVMWR5TTBwS1IzbGhkMEZwWldkWGFWbElhVUk1VmtoRWNsTmZhWEp0UW1walFWSnRjbmRvU0UxNGF6aGtSMmxMT0dGdlVXNUViak00ZWs1b1VFWTRhVFkzWW0weU1sSnhRMk5PYnpsUGIyeDVkRXRDWkd0TlJFTlJVRFpPTW1kR1NuUkJlRkpXV2t0dGMwUnpNblE0V1VkelJtZEpWM2RJWTBoVlpIZG1UbWhFZW1WeldVdFlSR1pKZFhSNGRuaFpUWE13YzAxc1FXdDRVMjVZU0dNdFprUXdTSEl6YlRGQ1luQnNRelp0WWxnNU9GRnplalZaU3pkR1JsQnpURWxUYTBocGRWRmllVmhPZUVJeU5GZHpaVmRhWTNGSU9XcGpRMk5ITjNOSk5FTllkMFZGVkVWVFFrUmllVU5sVmpkSVFqQXhUWFpmYzBaWE56WmFRMkUyUldkSE9EbDJOVlo0TjBoTU9YcHllSGRNVmpreE0yTTNORWxhYUVaMVRYZDZOa3RJTm1ReU0xWmZkalpUYjJoamVreG9XV0Z3VFZNeFQxRlFVakpoUlZCblFtOHhVMGhtTFhjd2FXNHpUbnAxV0Vvd1JVMXhNVnA0TFdvMVNURktXa2xKTmtodE1tcHFkRE5DUVdGRk1XWlFWbFJTTkdSSFowc3piMkl5U0U1aVdFTlZWMGxRVWxwc1IxcGZTSGxQYzFjMmJ6WjJXRkZaYW5BMlFtRnlUQzFUZVU1TVh6UjRkMWR1UjFWS1FWZFZjMmxLY1Y4NVIyRTFVMjlvWTFJeFN6aE9URmszUlZSSllYcDJiazVQV0hWeE4zSTFURnB4TmtGSVpuZHBUV3hqZDB0V2FsaGtkek5FTW01TmIzTkxMVmcyVTFsbmFHSmxibXR3YTFsclluVkhNbWx3YUVkWFUxY3lXbkpyVUVsWU9FcFBXazgyVWxscU4xUm5lVUpIWTNwNlZXRmlWMGgwY21ORVZGOVNRVTlzWTBaVlduZFNUMDlCVEU5c2VteEJXazFpVjBsTlVucGtTWFJLT0ZWd1NWRnljMkkwZDFwUk1HUk5RVGRYWkc0NVVGaG1ablpOTFhaVFZFbEtYekJ4YzBFMWFuTndRVXhPWWswd1UxSjJNWEJYVUhOV1MwWnZNVTFtYVZaM1NDMXlRa1pYUzNsVmIwZDFiREYxVEZKRU5rMWpjVE5hV2xsU2VWWkdXV0oyU25ORWRuRXhSRXBrUzNsaGRXMWhTbXh2Y1VGWWVVcE1TbVpoZUhkcFkwYzFOMVZhWjNWWmRHVnBjMWRuYzE5dExYZFNabmwyVlcxUlRtTXRjM055ZEVscGRUZzNjMFpOU0VaM05XRk1SbDgzYjBneFdUTmlPUzF6TTA4NFpFYzNaM2hxVVdkMU1ETnFWRGhmTmxwM2Nrb3hlbTFYZVROclRIaEtSRmhzZVVWdE0yWkhSazAyWmxoVWJXa3lNakpuWW5WMlYwdEtWbU5HY0VKeFlrRXpPSGxZZGxaVVVuVllaSGwxY2tWVGJHNUNRVVY2YWtobmJrZHBlRjk1YjNsTGFXUk1aVzlKZFhKaVRFMDVkbkZ0YTFoRlgxQXphazFvYVhWaWNsaFJUR0ZaVjJKRVdrTkpVbXBzUWpOMFZrbzFNM3B5Wm1WQ1ZHOUpOMVZ0ZG1OZlExVnlibTU1VTNsRFlVRm9RUzF2VEMxWFV6bEJabFJ0V1dWTVREZHBhWGQxV1ZkeFRsQnNaalZKZERBMFgzbzNRMUpKUzBwek5IZE9hMUZmZG5kTVNVOWlha2xRVURsVVZYRXhZMG8zTFdKNmFWaDNkVTh4UW0xb1pGWm9jR1Y0VjJsbUxXTnNXVlpRVDJOQlZsbHZRbEV0YkZSNFdXOXNZbXRGU0RreFFqQkpkMDgyV1VScGJGWlZlazUwT1RWbFdqRXdUVlJoWlhkcFVDMWZNVEZ5WlUxaWR6QlJUMnMwU0VKSVJIUkhNbTFqUlRGd1ozbEdiRVYzZVU5RFNGZEZOM1pTU1hCeWQxVkRaV2hOUkVoalQwcEVPRFZTT1VGZmFuSTRUMmhtVWxoNGRuQXdSakp4VnpWc2JISnNSR1paT1ZOU1UyZE9OVGxVYVdaT1ZYQkNWVTQ0TUhwbFUyTm1ZMWRCT1ZKc2RsWlhaV05mZDJWa01sUlVObTE0UjBkT0xXTm1ZV0ZMVjJWTVFqWTBORmRwUldsd1dEZERWMUpQVFhweVgzWjFZME0yWjNaV1FVMVhiMHR1VEc1aVRXSTVXRFJ1Y0docGVrOXpZVFpoY0Zsak9UVjZXVWxQWDFabGJqa3hTMVpZY0RaVk1YWm1VVmx1TUdWck0zQnhWMFZ4ZG1GdGNVaFFOVkZ4ZVZoTlZYWnBkMWRVV2toRFFWYzFaRGhRTjBRNFZERjVUM1JrYWxCNk5rTTNUbTlNZFhaT2VteHRNM2RJZEhaRlUzSlRPV000UzNGME1FeFljVzVIZVdnNVFsbG5Xa1l3UTFST1JEWllSVmt4TFVGeGVVRXhWbkoxU1ZCc09EVndhMDVUWWxneWVubG9VRk5CYjBZME9XVkxRbGRIV0ZWTVgzVlNURjlyVG1GaGFscDVjSFZYV2pSZlkyOUdOMlJhZVRoc2VEZDRkRmw1Tm5CWFNVOXdSakJuVm5ocFNsYzBkRGRYV1dWdlZWQm1YMVJ3YW5oQ2Myd3laMHhRVlVKaVNreDJSMGN4VkhkeFV6Sk1MVEJDYzBocVVVUjViMmwyYUVsdVkxUnRNVTlSWkdsTWJVNVBia3d5VG5CSk0ydEVWRVZPZFhwMldrOTZhVFZuWjJsTk1pMXdNalJ5TUZKcWN6WnZWVjl5YjB0TlNWOUNRbFJ5VWpkc1EyOVhNVk56YzA1bGFtWXlaV0ppTTBsamFFSkJhR2xmT1hGdlRsaFNOMFp6UlUxelVrUktibGRXU1ZwTFV6aHdRemsyY3pSTFpFMU9SVXBoVjFCRVVFOWtOVWhTY2xRM2VGbFBPREYxVGtwM1dFZGxhVkpzUlMxTmVtRlphSFJQTFU1U1YwSm1UalIzYVVKNU0wMTBVbGhFU2xoSGJFVjVPSFZHTTBSRE5XTm5OMTlSUkhBeGRGSmhOa1UwWVRsWGNsTklWekJWVkhaSGVERldRalV3U1haRVZVOUJWRmhoU2psalRIRXpSMFJxVkdkTFRGTmlORXN5U2xCTGFrUjZUMUpCTmpkRE9EUmhRbWhHYVZKWlpHRTFRM1ZVUXpJeWNsVlFRa2w1YVhoWE9XbHJhM2h4VjFWNFh6UXlkVms1U0RKeGExTlphMlJDY1VoM1ozSmlMVjl0WWtsellsQnFPR0ZOY0cxbVgzaHRNSFJVV0RoTldGbHVUMlpIVldkcWRXbDVZbWxZVkROQ1QweFBPVzl1Y2xablIyVktWVGcxVFY5UlVuWmpXRmRmZDBGTGJHSjRhVmRYY0ROSGJWbE9UMDlRVm1SWk56Tldha00xWVhabVpWQTRTMUIxV2kxUU9HbDZjR1l0Y0ZwQ1YybE9jMUJSWlRCUVIyUTRhMmxxT1doalZXTTNTRUZoVEZsNmRFNWhVbkZuY1d0RWMxOVVaVzV2TWpkWlZtUlBaR2hQWVc1TGQwdGtORXc0UWxwRmMwbEpNSEU0TTBNNFZYRjZjWGxVYmtobVVWbzBWMFk0Y0c1c2JXOURMWFpvZFRKME1sOUpiRXR5Y1cxemNVVndaM2cwZWtoSlNIQlFWMDA1TWw5ZmQwZHJSVE5zZDFWNU1XTjNTRmxTTnpkQlkzWldORkZqVlc1NlMyOUhSMll4UkhKMGNuVktZMkoxTTNGVlowUkdOVnBpYkVWdGRtSTFlV2RNVm1od1JsZHdiSEV6WTNjek0yNVBkMUV3VG1oU1gwTkpjREZMVjNkNWVrRlVNbGh0V0cwMVltVlFRbVpLYW5CUFoxbENUMngzTVZKMWMzQlhVbWgxYkMxU1ZYbEZPVTkzV2pKdmMwcE5SbmQwZDE5M1RGZEtVM015TXkweGJFdFJYMUEzU1VSRGRVVXhWVkJZZW1GVlZWazFWVVZmY3pOYWRuTTVPR2t0Y2tKSFUwSk9iamhzV0c1WmVVTndSRUpOV2tKTFVpMWxjSE5HZVVwUGNFcERObmxvTmxSRFRtMXVVM2QyUzFvMmQycGlkVGRhUm1GQ2NEWlpVRlpqZUZrd1pHZHhNbGhYTW5kTFVWSk1lblEwYkROdlNWZGpRVGRKVkhnelgwMURPRFpNZUZGb1VHNTRWVkl3Y0RWS2FuQnRVMUpVYnpscVYycHJPVXN5VnkxM05sRmxjVkJWYldGUlJsVmthMlkwTTNGU1FYZExTMUJPYWw4M2VERTNkemt0TWpGRk16aFZSa1JuVUhseWRIaFpTa290ZUhSa2VGaEJZM1o2TlY4M1JqTjFhVEpaVW5WSFQyZGxha3RmZDFkWFgzQnRSRVZEWlU5MU9GWlZWMmxIUTFneFZFRk9XRUpzWDNoSFZtazFSVXh2TTJsbWRHeGlaMUIwWlhwSVdVZGphMjFoV2t0aWRqaFVZVTE1TFhGaFpuaEJXQzF4TjB4V09XMVFjM2RMY1RGb1prZFlURjlmWTJwMFN6bFVjV281VEdKWFdFb3pWVGRJY21rMmFuUndSRGRFVmtwRmVUVnVjREJhVmkxM2MySjFUWHB3VGtwVlJGSnRaRk41TUZWSlUzQnBZa3RyVG1GZldXUkdXRGxYTm5KS04weHBjVUp2UjIxaVJpMDJWbGxGTkV4WVJXaE9hWEp5VDNscGR6TkNjWEJmYzB0alVGbFVNekU1TUZKSlZXNVhkRzFYTjJkWE5IQjNkbTV5WHkxRFZISXpjbUZsTm1ka2IyczNhMlpFY1dOWU9XOUpSbkZ1VEZrM1YzQnlRVzFXUm05UVNITndaVzVNWDBORFZsaFliM0psTUVoV2NrOHdheTFGY0ZKU1NHMXdhVVJXYjFoc1gzcFpaVTFVU2xOa1kydEZRWEJ5UTJKbk1VVlpUa3BCYjJJM2FHMHRaRE4xUkVwNGJsaHVZV1JJUVRSNVdXa3pWa0pPYjNWVlJuQmZaRzVKT1cxM2NWbHlVVFpHVjBoQ2MwdExhbVkwV1ZGdlUyOW9Samx5ZFZGTk5XcFJZWG90VERSMGFqZE9PVU5oTFUxaVN6UllZMjFPTW1OSWJ6TmpNR3gzU2xCVlJEQTBValEyUjBWRlRHNW9Rbk52YUc1eWJGVkpOMUZrVFVOd2RreHNabWc1ZFdjd1pIcDFlREZaVFVFM0xUVnRUMU4xYVMxdGMyVTRXamwyUVdwb1pFNW9VSGcyYWxWamVISkRiREYyWVZGb2NuQlpSa0l4VDB4eGRHOXNWak5zYTJwSU9EUlpla3BzYW1KNlRubE9VR1Z6VVdVeGFGbE1OVXBpUjFWTWNuWnpVRmRxU2xGdE5XYzVTWGRGVFVWdVMzRkpPRkZHVGpWV1NtUlVjRzFEVmpKYVpGSnNObVJCV1Y5blZscEhRV3RoY3pad1EwcEZSV0Z2VlU5eFpFc3RWekpmWlZsVVYxVkNXVnBSZEdKcmFHMTJUbVpGWVhCUmJWbHdZWFJRWVZsNVJUTlZXa2xwYWtWU1owTlpPV2xtZG10UlNVUTJaMTh0ZEZaNGJFVm9Zak5sVG1SbFRXVnRUMVpVU3pSdFoxQlBNM1ZPVjFkck1XUnRiMjEwYjBGUUxWVTNiRVEzU2poNVdsbHdRalJCTFV3M05VRmtkMHRwVjJsaGNGaGtkWEpZVWxKMVZ6ZDNObEZuY0hOSFRqSmZlRXh1ZERjNVpGaDJWMUpxT0RGd1VqUjFZVFpqY1RKalprOUhVRm96TFhKb2FXOWhRMEZ5ZG5oVmExTnVWbGc1WkZaV1kyNTZaakppWlU5SFYwSnFRbHAzWTJZNVNpMWxXVlUyTUU1SVlURTBORFJTTUhGRlVFMVRNRlJvVHpoWFlXbEtVRzlsU0ZGTFEyOU1aRmRDUTBoa1QyOWZSVE00TW5SWVNGVlROR3BSWkROWFIzQnZUVzlmTVRGMVNHaE5MWGd5Ykhock5rVjROMlZCWjI5NmNHWXlhMEoyZEdGUlYyeGZjVTlwTlVaVWJVdzFOblJDTUU4eE56ZDRaVE42VkZKaFJWSmxhMUpMT1VsMlpEVldPV0p6YWpWVGIzaFFUWGhsVGxCNlJFaE5UWFEyVG5OWlpraFlZMlJITTBNMWIxTjBRWGhvVFhsdlFVTnFhV1V5WWtGU1dWWnVZWFpsZFVWRlVIQTJUVkkxWlhZM1IzRkJXamcxVkhWUlVWUnFlbloxZUVFd01HRmFkRFo0U2kxUmRVTjRTWFl5V0hWaWEzRktXVFZ4YWt4bGFWaG9TRkJHYkVOellXbGxWbTAwUWtGdFJuWlZhbDl6TVVOUlpGaElVVEZVUjJkYVdXNUdaRFZzVVc4NWNFdFJTamRKWmt4elprZGxZbEJzU1Y5WFFrZEthMXAxU3pGSVVuWnZYMU16YVdRd2JFSlJWM2RGTFd4elozaHNhM3B1ZG01V04xaE5XbXBOU2xwTVMzUkVZMWhwTTBsVVNVeDNNVGxyT0VWMFJuaFpNbHB0VFdoR1FscDZSalpTTm10UGIwZHVObU5VTWpkRGFVbHlWM05oVVd3eE5TMTZUREpNTjJwMVlsRXlNemx5Y3pFNVkydGhkV3B1ZEVzNE1VaHVXRXRHWWpSME4wSnJXamhoVWtVMmNuUnlOemRoUjFKNVdXa3dYM1ExTkhSc2FEa3hTV3RoVjJkUk1USmthM293VG10RU0xSTVjV0YzTmtFNVYyd3piMUZuYlRoRFJ6VldSVGRSVVU1cFltOXZRbTB3V1hkVk0zUnFlRkV0UVRKNllXMVFlRXB1Y1c0MGVHMDJXSGczVmpkbFptbERZbGxCUldONlUwTnBOMUl4TVdKT2NVVlpVazlvUXpkdmFHVnpPV0pvVUU1eWVXbEJOV3BKYWtrMVgzUmZSV1I1YmxwQ1pHZEZRMlZZUm05VU9WWndSbGxuZGtGSFoydzVkRkpGY1RaUmVqWjRUbEl5TFhGeVp6ZDRiMWgyUkZkUFpYbHFTMUkwYVZrMGF6SXRhVWhWZFUxZlkwaHZlVmQyTm5GRVpHTlRhM3A2TlRZMU5IbHlhbVJpU20xU05FMWhSMlUyVkVwdWQxbEtOeTFLWTFWaU1tMW1YMFJqZFRGTFVFRkRRMk5qT0RCSlRYWmFZVGRMTTJSNFlYWk5lVEJJVjJSRFRrRlRkVzVIUVhBMU4xOUZVMUZUTUVaaE0wTXlRazlaYzNFMWIyNWxiakZFTlVzeWQweGxYMnB5TVhoeldYWkRiMDlaYTJrMVRFTk5XalJ1VTFsWVRYSm1aekJPU2tGUlJuUldMVlJFYmtsUU1tbE1TMlozUTFwS2N6QkthVlZaUTJGMUxTMDRNM2xPWmpSaFpIZEVVakp3TVZabkxURlNRelJaUzJveVExOURlVmxJYlZOTlFYQkxWek4xVFVwR1RGVjNjbGRzVjNaV1ZIVlRUa3BqVjBZelQzZFNSM0JTWHpOUWJrVTRNM1JLZVhONmFFWklZa3BTT1haTlJrRmxTVFIyY2poRldXMUdTMlZqYmtSWlpVOWhaa2xPYlZWck9GOXZaV0kxY2tSV1psVTJiVWhNVWpOcE1GWnlUVWhPVkhkVWRURllhbTFLVjBGR2FXOTNVR3B1WHpGbk5rMVZWM0ZyUzBaWlp6azJja2RvVlhKV1dIQklTRGRVTWtkelgwSkVUMlpaVlZFemF5NTVNVXRPT1dGeWFEQnBORFJVYUZoVVFVaHRVVk5SLmVIeFdzX3o4M2Q0RXJCc1ZpR05Kd3g2Z2cwT0VHRzFMUlRRZGs0Q1RuNUUiLCJleHAiOjE2Mjk3NDA0ODIsImlhdCI6MTYyOTcyNjAyMn0.gNlw4vSe-bg_GA5T-Q3gvahL76v2XW76Zl3DLd4c4b0',
    callbacks: [
      {
        type: 'TextOutputCallback',
        output: [
          {
            name: 'message',
            value: '    message.innerHTML = \'[{"date":"1629718340876","sharedState":{},"status":"SUCCESS"},{"date":"1629718062493","sharedState":{},"status":"FAILED"},{"date":"1629718058761","sharedState":{},"status":"FAILED"},{"date":"1629717404866","sharedState":{},"status":"SUCCESS"},{"date":"1629462816114","sharedState":{},"status":"SUCCESS"},{"date":"1629462799425","sharedState":{},"status":"SUCCESS"}]\';',
          },
          {
            name: 'messageType',
            value: '4',
          },
        ],
      },
      {
        type: 'HiddenValueCallback',
        output: [
          {
            name: 'value',
            value: '',
          },
          {
            name: 'id',
            value: 'HTMLMessageNode_vAlign_Neutral',
          },
        ],
        input: [
          {
            name: 'IDToken2',
            value: 'HTMLMessageNode_vAlign_Neutral',
          },
        ],
      },
    ],
  },
});

module.exports = {
  buildSingleValueCallback,
  buildTwoValueCallback,
  buildSuccessfulAuthenticationCallback,
  buildOIDCRedirectCallback,
  buildError401Callback,
  buildHTMLValueCallback,
};
