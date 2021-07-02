const terms = $(".accordion_item_trigger-t");
$(document).ready(function () {
  $(terms).append("<img class='arow' src='assets/third-party/images/wheel/arow.png' alt=''>");
  let arrow = $(".arow");
  arrow.first().css("margin-right", "27px");
  arrow.last().css("margin-right", "27px");
});

$(terms).click(function () {
  $(this).children(".arow").toggleClass("rotateThatBitch");
});
