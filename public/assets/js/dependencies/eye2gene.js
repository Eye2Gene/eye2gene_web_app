/*
    EG - Eye2Gene's JavaScript module

    Define a global EG (acronym for Eye2Gene) object containing all
    EG associated methods:
*/

// define global EG object
var EG;
if (!EG) {
    EG = {};
}

// EG module
/** global: Plotly */
(function() {
    EG.initFineUploader = function() {
        EG.fineUploader = new qq.FineUploader({
            element: $('#fine-uploader-validation')[0],
            template: 'qq-template-validation',
            request: {
                endpoint: '/upload'
            },
            thumbnails: {
                placeholders: {
                    waitingPath: '/assets/img/fine-uploader/placeholders/waiting-generic.png',
                    notAvailablePath: '/assets/img/fine-uploader/placeholders/not_available-generic.png'
                }
            },
            validation: {
                allowedExtensions: ['jpeg', 'jpg', 'tif'],
                itemLimit: 500,
                sizeLimit: 78650000 // 75MB
            },
            chunking: {
                enabled: true,
                concurrent: {
                    enabled: true
                },
                success: {
                    endpoint: "/upload_done"
                }
            }
        });
        EG.fineUploader.addExtraDropzone($(".drop_zone_container")[0]);
    };

    EG.initSubmit = function() {
        $('#analysis_btn').on('click', function() {
            $('#loading_modal').modal('open');
            $('#modal_header_text').text('Running Analysis');
            $('#modal_text').text('This should take a few minutes. Please leave this page open');
            var formData = $("#eye2gene_analysis").serializeArray();
            formData.push({
                name: "files",
                value: JSON.stringify(EG.fineUploader.getUploads())
            });
            $.ajax({
                url: '/analyse',
                type: 'post',
                data: formData,
                dataType: "json",
                success: function(data) {
                    $('#loading_modal').modal('close');
                    $('#analysis_results').show();
                    console.log(data);
                    EG.produceResults(data);
                    $("html, body").animate({
                        scrollTop: $('#analysis_results').offset().top
                    });
                },
                error: function(xhr) {
                    $('#loading_modal').modal('close');
                    console.log(xhr);
                }
            });
        });
    };

    EG.initDownloadResultBtn = function() {
        $("#download-all-results").on("click", function() {
            $("#modal_header_text").text("Creating Download Link");
            $("#loading_modal").modal({ dismissible: false });
            $("#loading_modal").modal("open");
            $.fileDownload($(this).data("download"), {
                successCallback: function() {
                    $("#loading_modal").modal("close");
                },
                failCallback: function() {
                    $("#loading_modal").modal("close");
                }
            });
            $("#loading_modal").modal("close");
            return false; //this is critical to stop the click event which will trigger a normal file download!
        });
    };

    EG.delete_result = function() {
        $("#analysis_results").on("click", "#delete_results", function() {
            $("#delete_modal").modal("open");
            var resultId = $(this).closest(".card").data("uuid");
            $("#delete_modal").attr("data-uuid", resultId);
        });

        $(".delete-results").click(function() {
            $("#modal_header_text").text("Deleting Result");
            $("#loading_modal").modal({ dismissible: false });
            $("#loading_modal").modal("open");
            var uuid = $("#delete_modal").data("uuid");
            $.ajax({
                type: "POST",
                url: "/delete_result",
                data: { uuid: uuid },
                success: function() {
                    location.reload();
                },
                error: function(e, status) {
                    EG.ajaxError(e, status);
                }
            });
        });
    };

    EG.share_result = function() {
        $("#analysis_results").on("click", "#share_btn", function() {
            var share_link = $(this).closest(".card").data("share-link");
            $("#share_the_link_btn").show();
            $("#share_btn").hide();
            $("#share_link_input").val(share_link);
            $("#share_link_input").prop("readonly", true);
            $("#share_modal").modal("open");
            $("#share_modal").attr("data-share-link", share_link);
            $("#share_link_input").select();
            $.ajax({
                type: "POST",
                url: share_link,
                error: function(e, status) {
                    EG.ajaxError(e, status);
                }
            });
        });
        $("#analysis_results").on("click", "#share_the_link_btn", function() {
            var share_link = $(this).closest(".card").data("share-link");
            $("#share_link_input1").val(share_link);
            $("#share_link_input1").prop("readonly", true);
            $("#share_the_link_modal").modal("open");
            $("#share_the_link_modal").attr("data-share-link", share_link);
            $("#share_link_input1").select();
        });

        $(".share_link_input").focus(function() {
            $(this).select();
            // Work around Chrome's little problem
            $(this).mouseup(function() {
                // Prevent further mouseup intervention
                $(this).unbind("mouseup");
                return false;
            });
        });
    };

    EG.remove_share = function() {
        $(".remove_link").click(function() {
            var share_link = $(this).closest(".modal").data("share-link");
            var remove_link = share_link.replace(/\/sh\//, "/rm/");
            $("#share_the_link_btn").hide();
            $("#share_btn").show();
            $("#share_modal").modal("close");
            $("#share_the_link_modal").modal("close");
            $.ajax({
                type: "POST",
                url: remove_link,
                error: function(e, status) {
                    EG.ajaxError(e, status);
                }
            });
        });
    };

    EG.ajaxError = function(e, status) {
        var errorMessage;
        if (e.status == 500 || e.status == 400) {
            errorMessage = e.responseText;
            $("#analysis_results").show();
            $("#analysis_results").html(errorMessage);
            $("#loading_modal").modal("close"); // remove progress notification
        } else {
            errorMessage = e.responseText;
            $("#analysis_results").show();
            $("#analysis_results").html('<div class="card red lighten-2" role="alert"><div class="card-content white-text"><h3>Oops! Eye2Gene went wonky!</h3><p style="font-size: 1.5rem"><strong>Apologies, there was an error with your request. Please try again.</strong></p><p>Error Message:' + errorMessage + " The server responded with the status code: " + String(e.status) + ". Please refresh the page and try again.</p><p>If the error persists, please contact the administrator.</p></div></div>");
            $("#loading_modal").modal("close"); // remove progress notification
        }
    };

    EG.produceResults = function(data) {
      console.log('Producing Results')
        // $(".analyse_card").data("assets_path", data.assets_path);
        // $(".analyse_card").data("result_uuid", data.uuid);
        // $(".analyse_card").data("share-link", data.share_url);
        // $("#open_in_new_btn").attr("href", data.results_url);
        // var download_link = data.assets_path + "/relayer_results.zip";
        // $("#download-all-results").data("download", download_link);
        // EG.delete_result();
        // EG.share_result();
        // EG.remove_share();
    };


    EG.addUserDropDown = function() {
        $(".dropdown-button").dropdown({
            inDuration: 300,
            outDuration: 225,
            hover: true,
            belowOrigin: true,
            alignment: "right"
        });
    };

    EG.setupGoogleAuthentication = function() {
        gapi.auth.authorize({
            immediate: true,
            response_type: "code",
            cookie_policy: "single_host_origin",
            client_id: EG.CLIENT_ID,
            scope: "email"
        });
        $(".login_button").on("click", function(e) {
            e.preventDefault();
            /** global: gapi */
            gapi.auth.authorize({
                    immediate: false,
                    response_type: "code",
                    cookie_policy: "single_host_origin",
                    client_id: EG.CLIENT_ID,
                    scope: "email"
                },
                function(response) {
                    if (response && !response.error) {
                        // google authentication succeed, now post data to server.
                        jQuery.ajax({
                            type: "POST",
                            url: "/auth/google_oauth2/callback",
                            data: response,
                            success: function() {
                                // TODO - just update the DOM instead of a redirect
                                $(location).attr(
                                    "href",
                                    EG.protocol() + window.location.host + "/oct_segmentation"
                                );
                            }
                        });
                    } else {
                        console.log("ERROR Response google authentication failed");
                        // TODO: ERROR Response google authentication failed
                    }
                }
            );
        });
    };

    EG.protocol = function() {
        if (EG.USING_SLL === "true") {
            return "https://";
        } else {
            return "http://";
        }
    };

}());

(function($) {
    // Fn to allow an event to fire after all images are loaded
    $.fn.imagesLoaded = function() {
        var $imgs = this.find('img[src!=""]');
        // if there's no images, just return an already resolved promise
        if (!$imgs.length) {
            return $.Deferred().resolve().promise();
        }

        // for each image, add a deferred object to the array which resolves
        // when the image is loaded (or if loading fails)
        var dfds = [];
        $imgs.each(function() {
            var dfd = $.Deferred();
            dfds.push(dfd);
            /** global: Image */
            var img = new Image();
            img.onload = function() {
                dfd.resolve();
            };
            img.onerror = function() {
                dfd.resolve();
            };
            img.src = this.src;
        });
        // return a master promise object which will resolve when all
        // the deferred objects have resolved
        // i.e. - when all the images are loaded
        return $.when.apply($, dfds);
    };

    $(function() {
        $(".modal").modal();
        $("select").material_select();
        $(".button-collapse").sideNav();
        EG.addUserDropDown();
    });

    $(function() {
        return $.ajax({
            url: "https://apis.google.com/js/client:plus.js?onload=gpAsyncInit",
            dataType: "script",
            cache: true
        });
    });

    window.gpAsyncInit = function() {
        EG.setupGoogleAuthentication();
    };
})(jQuery);
