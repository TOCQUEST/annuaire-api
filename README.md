
Une API de base pour les données de l'annuaire de service-public.fr


## Setup

```bash
sudo apt-get update
```


#### Node
https://github.com/creationix/nvm#install-script


#### Script de mise à jour des données
```bash
FILENAME=all_latest.tar.bz2
LATEST_TIMESTAMP=$(stat -c %y tmp/${FILENAME})
wget --directory-prefix=tmp --timestamping http://lecomarquage.service-public.fr/donnees_locales_v2/$FILENAME

if [[ "$LATEST_TIMESTAMP" == `stat -c %y tmp/${FILENAME}` ]]
then
    echo NOTHING TO DO
else
    echo EXTRACT!
    mkdir --parents data
    tar xf tmp/all_latest.tar.bz2 -C data --strip-components=1
fi
```

#### Systemd service, pour `/lib/systemd/system/annuaire-api.service` :
```
[Unit]
Description=API de base pour les données de l'annuaire de service-public.fr

[Service]
User=cloud
Group=cloud
WorkingDirectory=/home/cloud/annuaire-api
ExecStart=/home/cloud/.nvm/versions/node/v6.12.2/bin/node index.js

[Install]
WantedBy=multi-user.target
```


```
sudo systemctl daemon-reload
sudo service annuaire-api start
sudo service annuaire-api status
sudo systemctl enable annuaire-api
```

#### Ajout à la configuration NGINX
```
  location /v2 {
    proxy_pass http://localhost:12345;
    proxy_redirect    off;
  }
```


