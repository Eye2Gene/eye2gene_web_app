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
            element: $('#retinal_image_upload_fine_uploader')[0],
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
                allowedExtensions: ['aai', 'art', 'avs', 'bgr', 'bmp', 'braille', 'cals', 'caption', 'cin', 'cip', 'clip', 'cmyk', 'cur', 'cut', 'dcm', 'dds', 'djvu', 'dng', 'dot', 'dpx', 'ept', 'exr', 'fax', 'fits', 'fts', 'gif', 'gradient', 'gray', 'hdr', 'hrz', 'html', 'icon', 'info', 'inline', 'ipl', 'jbig', 'jnx*', 'jpeg', 'jpg', 'json', 'label', 'mac', 'map', 'mask', 'mat', 'matte', 'miff', 'mono', 'mpc', 'mpeg', 'msl', 'mtv', 'mvg', 'null', 'otb', 'palm', 'pango', 'pattern', 'pcd', 'pcl', 'pcx', 'pdb', 'pdf', 'pes', 'pfm', 'pict', 'pix', 'plasma', 'png', 'pnm', 'preview', 'ps', 'ps2', 'ps3', 'psd', 'pwp', 'rgb', 'rgf', 'rla', 'rle', 'scr', 'sct', 'sfw', 'sgi', 'six', 'sixel', 'stegano', 'sun', 'svg', 'tga', 'tif', 'tiff', 'tile', 'tim', 'ttf', 'txt', 'uil', 'uyvy', 'vicar', 'vid', 'viff', 'vips', 'wbmp', 'wmf', 'wmz', 'wpg', 'x', 'xbm', 'xc', 'xcf', 'xpm', 'xps', 'xwd', 'ycbcr', 'yuv'],
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
        EG.genetic_fineUploader = new qq.FineUploader({
            element: $('#genetic_upload_fine_uploader')[0],
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
                allowedExtensions: ['aai', 'art', 'avs', 'bgr', 'bmp', 'braille', 'cals', 'caption', 'cin', 'cip', 'clip', 'cmyk', 'cur', 'cut', 'dcm', 'dds', 'djvu', 'dng', 'dot', 'dpx', 'ept', 'exr', 'fax', 'fits', 'fts', 'gif', 'gradient', 'gray', 'hdr', 'hrz', 'html', 'icon', 'info', 'inline', 'ipl', 'jbig', 'jnx*', 'jpeg', 'jpg', 'json', 'label', 'mac', 'map', 'mask', 'mat', 'matte', 'miff', 'mono', 'mpc', 'mpeg', 'msl', 'mtv', 'mvg', 'null', 'otb', 'palm', 'pango', 'pattern', 'pcd', 'pcl', 'pcx', 'pdb', 'pdf', 'pes', 'pfm', 'pict', 'pix', 'plasma', 'png', 'pnm', 'preview', 'ps', 'ps2', 'ps3', 'psd', 'pwp', 'rgb', 'rgf', 'rla', 'rle', 'scr', 'sct', 'sfw', 'sgi', 'six', 'sixel', 'stegano', 'sun', 'svg', 'tga', 'tif', 'tiff', 'tile', 'tim', 'ttf', 'txt', 'uil', 'uyvy', 'vicar', 'vid', 'viff', 'vips', 'wbmp', 'wmf', 'wmz', 'wpg', 'x', 'xbm', 'xc', 'xcf', 'xpm', 'xps', 'xwd', 'ycbcr', 'yuv'],
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
    };

    EG.initSubmit = function() {
        $('#analysis_btn').on('click', function() {
            // check if at least one file has been uploaded
            if ($.isEmptyObject(EG.fineUploader.getUploads())) {
                $('.validation_text').text('Please upload a file first.');
                return false;
            }

            // Check if some files are still running
            if (EG.fineUploader.getInProgress() !== 0) {
                $('.validation_text').text('Please wait until all the files have completely uploaded.');
                return false;
            }
            $('.validation_text').text('');

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
                success: function(data) {
                    console.log(data);
                    $('#loading_modal').modal('close');
                    $('#analysis_results').html(data);
                    $('#analysis_results').show();
                    $('.collapsible').collapsible();
                    $('.materialboxed').materialbox();
                    $('.carousel.carousel-slider').carousel({
                        fullWidth: true,
                        indicators: true
                    });
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

    EG.addUserDropDown = function() {
        var elems = document.querySelectorAll('.dropdown-trigger');
        var options = {
            inDuration: 300,
            outDuration: 225,
            hover: true,
            coverTrigger: false,
            alignment: "right"
        };
        var instances = M.Dropdown.init(elems, options);
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
        $('.sidenav').sidenav();
        EG.addUserDropDown();
    });

})(jQuery);