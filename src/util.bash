readonly LOG_FILE='/var/log/internet-etecsa-login.log'

log() {
  local -r action="$1"
  local -r code="$2"
  local msg="$3"
  
  if [ "$code" != 0 ]; then
    msg="ERROR: ${msg}"
  fi
  local -r entry="$(printf "$(date +%Y%m%d-%H%M%S)  %-15s %-4d %s\n" "[${action}]" "$code" "$msg")"
  echo "$entry"
  echo "$entry" >> "$LOG_FILE"
}
