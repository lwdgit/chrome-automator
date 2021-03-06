/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const readline = require('readline')
function ask (question, options) {
  return new Promise(resolve => {
    const iface = readline.createInterface(process.stdin, process.stdout)
    const optionsStr = options.map((o, i) => i + 1 + '. ' + o).join('\r\n')
    iface.setPrompt(question + '\r\n' + optionsStr + '\r\nChoice: ')
    iface.prompt()
    iface.on('line', (_answer) => {
      const answer = toInt(_answer)
      if (answer > 0 && answer <= options.length) {
        iface.close()
        resolve(options[answer - 1])
      } else {
        iface.prompt()
      }
    })
  })
}
exports.ask = ask
function toInt (n) {
  const result = parseInt(n, 10)
  return isNaN(result) ? 0 : result
}
// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7QUFDSCxZQUFZLENBQUM7O0FBRWIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRXJDLGFBQWEsUUFBZ0IsRUFBRSxPQUFpQjtJQUM5QyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztRQUN4QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV4RSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxNQUFNLEdBQUcsVUFBVSxHQUFHLGNBQWMsQ0FBQyxDQUFDO1FBQ2pFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVmLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBZTtZQUMvQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUIsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZCxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBT08sa0JBQUc7QUFMWCxlQUFlLENBQVM7SUFDdEIsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMvQixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDcEMsQ0FBQyJ9
