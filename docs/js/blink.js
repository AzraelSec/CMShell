var blink = function(objects)
{
    objects.each(
        function () {
            var t = $(this);
            setInterval(
                function () {
                    
                    if(t.css('display') == 'none')
                        t.show();
                    else
                        t.hide();
                }, 500
            );
        }
    );
}