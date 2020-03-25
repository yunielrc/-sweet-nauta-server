# Sweet Nauta Server

![Sweet Nauta Server](icons/sweet-nauta-server.jpg)

Servicio para gestionar la sesión nauta
> Si instala el servicio en entorno desktop; con el cliente de prueba `Sweet Nauta Server - Login Test`
> puede gestionar la sesión Nauta presionando un botón.

## Nota

### Para usuarios Nauta Hogar

El servicio aún no ha sido probado con nauta hogar.

### Para usuarios con router AirOS

Este servicio ha sido probado con un NSM5 versión AirOS XW.v6.2.0, es probable que funcione en otros dispositivos AirOS.

#### Debe conocer que

Cuando el dispositivo AirOS pierde la sesión dhcp con el router de etecsa el servicio se encarga de enviar la orden al dispositivo AirOS para que inicie una nueva sesión dhcp, el dispositivo AirOS tarda unos 14 segundos en este proceso, también depende de la calidad del enlace con el router de etecsa. En este caso debe esperar a que termine esta operación, después se iniciará la conexión a internet.

## Requisitos previos

- Distribución basada en debian.

> El servicio ha sido probado en Ubuntu 18.04 LTS y 19.10

- Algunos paquetes `npm` están bloqueados para Cuba, defina el proxy en el
  archivo `~/.npmrc`.

  Copie el siguiente texto dentro del archivo `~/.npmrc` y modifíquelo:

  ```text
  proxy=http://USER:PASS@PROXY-IP:PROXY-PORT
  https-proxy=http://USER:PASS@PROXY-IP:PROXY-PORT
  ```

  ```bash
  nano ~/.npmrc
  ```

### Requisito Opcional

> Solo si va a instalar el servicio en entorno desktop

- Ping indicator para ver estado de conexión a internet

  Configurar la extensión con ip `1.1.1.1`

  [Ping Indicator](https://extensions.gnome.org/extension/923/ping-indicator/)

## Instalar

Ejecute:

```bash
wget -qO - https://raw.githubusercontent.com/yunielrc/sweet-nauta-server/master/bin/install | sudo bash
```

### Configurar

Edite al archivo `.env`

- Defina las credenciales de su cuenta nauta
- Si tiene un router AirOS quite los comentarios a las variables `AIROS_ROUTER_IP`
y `BEFORE_CONNECT` removiendo la almohadilla `#`. Defina la ip del router.

```bash
sudo nano /opt/sweet-nauta-server/.env
```

Proteja el archivo `.env` después de editarlo

```bash
sudo chown nauta:nauta /opt/sweet-nauta-server/.env
sudo chmod 444 /opt/sweet-nauta-server/.env
```

Si tiene router AirOS añada la clave pública ssh generada `/tmp/id_rsa.pub` al dispositivo:  

![AirOS](docs/airos-ssh-key.png)

Habilite e inicie el servicio

```bash
sudo systemctl enable sweet-nauta-server --now
```  

Para actualizar el servicio automáticamente se creó una entrada en el cron del usuario `root`.

Para modificar la entrada ejecute:

```bash
sudo crontab -e
```

### Configuración Opcional

> Solo si instaló el servicio en entorno desktop

Asigne una tecla al comando `gtk-launch sweet-nauta-server-login-test` para conectarse
y desconectarse con más comodidad, pruebe asignarle `F9` como se muestra a continuación:

![Keyboard shortcut](docs/keyboard-shortcut.png)

## Uso

Si instaló el servicio en entorno desktop presione la tecla asignada para conectarse y desconectarse a internet o ejecute el acceso directo `Sweet Nauta Server - Login Test` para conectarse y vuélvalo a ejecutar para desconectarse.

Para ver el log ejecute:

```bash
tail -f /var/log/sweet-nauta-server.log
```

## Actualizar

Para actualizar el servicio a la última versión ejecute:

```bash
sudo bash /opt/sweet-nauta-server/bin/update
```
