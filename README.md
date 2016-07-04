# jquery-box-game
jQuery plugin that provides a simple box drawing puzzle game.

Requires pstrinkle/jquery-paintbox


Plans
-----

See issues.

Usage
-----
```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="/libs/jquery-paintbox/dist/jquery.paintbox.js"></script>
<script src="/libs/jquery-box-game/dist/jquery.box-game.js"></script>

<div id='container'></div>

<script>
    $('#container').boxGame({});
</script>
```

Options
-------
You should specify options like in usage example above.

| Name | Type | Default | Description |
| ---- | ---- | ---- | ---- |
| rows | integer | `50` | Number of rows. |
| cols | integer | `50` | Number of columns. |
| offColor | css color string | `white` | Background color of the gameboard. |
| colors | array of CSS color strings | `['black', 'green', 'lightgreen', 'lightblue', 'blue', 'red']` | Colors for the blocks | 


Methods
-------
There are a few methods to programmatically change the painting.

| Method | Param | Type | Description |
| ---- | ---- | ---- | ---- |
| `start` | |  | Start the game! |

Events
------

| Event | Handler |
| ---- | ---- |
| `color-change` | `function(event, color)`: <br>- `event` - jQuery event <br>- `color` - next block color |
| `points-earned` | `function(event, points)`: <br>- `event` - jQuery event <br>- `points` - points earned |

License
-------
[Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
