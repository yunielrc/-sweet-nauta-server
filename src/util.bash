readonly LOG_FILE='/var/log/sweet-nauta-server.log'

log() {
  local -r action="$1"
  local -r code="$2"
  local msg="$3"
  
  local -r entry="$(printf "$(date +%Y%m%d-%H%M%S)  %-12s %-35s %s\n" "[${action}]" "$code" "$msg")"
  echo "$entry"
  echo "$entry" >> "$LOG_FILE"
}
