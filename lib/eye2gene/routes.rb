require 'base64'
require 'English'
require 'json'
require 'sinatra/base'
require 'slim'
require 'slim/smart'

require 'eye2gene/history'
require 'eye2gene/run_analysis'
require 'eye2gene/version'

module Eye2Gene
  # Sinatra Routes - i.e. The Controller
  class Routes < Sinatra::Base
    # See http://www.sinatrarb.com/configuration.html
    configure do
      # We don't need Rack::MethodOverride. Let's avoid the overhead.
      disable :method_override

      # Ensure exceptions never leak out of the app. Exceptions raised within
      # the app must be handled by the app. We do this by attaching error
      # blocks to exceptions we know how to handle and attaching to Exception
      # as fallback.
      disable :show_exceptions, :raise_errors

      # Make it a policy to dump to 'rack.errors' any exception raised by the
      # app so that error handlers don't have to do it themselves. But for it
      # to always work, Exceptions defined by us should not respond to `code`
      # or http_status` methods. Error blocks errors must explicitly set http
      # status, if needed, by calling `status` method.
      enable :dump_errors

      # We don't want Sinatra do setup any loggers for us. We will use our own.
      set :logging, nil

      # Use Rack::Session::Pool over Sinatra default sessions.
      use Rack::Session::Pool, expire_after: 2_592_000 # 30 days

      # view directory will be found here.
      set :root, -> { Eye2Gene.root }

      # This is the full path to the public folder...
      set :public_folder, -> { Eye2Gene.public_dir }
    end

    helpers do
      # Overides default URI helper method - to hardcode a https://
      # In our setup, we are running passenger on http:// (not secure) and then
      # reverse proxying that onto a 443 port (i.e. https://)
      # Generates the absolute URI for a given path in the app.
      # Takes Rack routers and reverse proxies into account.
      def uri(addr = nil, absolute = true, add_script_name = true)
        return addr if addr =~ /\A[a-z][a-z0-9\+\.\-]*:/i
        uri = [host = '']
        if absolute
          host << (Eye2Gene.ssl? ? 'https://' : 'http://')
          if request.forwarded? || request.port != (request.secure? ? 443 : 80)
            host << request.host_with_port
          else
            host << request.host
          end
        end
        uri << request.script_name.to_s if add_script_name
        uri << (addr ? addr : request.path_info).to_s
        File.join uri
      end

      def host_with_port
        forwarded = request.env['HTTP_X_FORWARDED_HOST']
        if forwarded
          forwarded.split(/,\s?/).last
        else
          request.env['HTTP_HOST'] || "#{request.env['SERVER_NAME'] ||
            request.env['SERVER_ADDR']}:#{request.env['SERVER_PORT']}"
        end
      end

      # Remove port number.
      def host
        host_with_port.to_s.sub(/:\d+\z/, '')
      end

      def base_url
        @base_url ||= "#{Eye2Gene.ssl? ? 'https' : 'http'}://#{host_with_port}"
      end
    end

    # For any request that hits the app, log incoming params at debug level.
    before do
      logger.debug "#{@env["REQUEST_METHOD"]} #{@env["REQUEST_URI"]} => #{params}"
    end

    # # Home page (marketing page)
    get '/' do
      redirect '/analyse'
      # slim :index, layout: false
    end

    get '/analyse' do
      redirect to('/login') if session[:user].nil?
      slim :analyse, layout: :app_layout
    end

    get '/my_results' do
      redirect to('/login') if session[:user].nil?
      @my_results = History.run(session[:email])
      slim :my_results, layout: :app_layout
    end

    # Individual Result Pages
    get '/result/:encoded_email/:time' do
      redirect to('/login') if session[:user].nil?
      email = Base64.decode64(params[:encoded_email])
      json_file = File.join(Eye2Gene.public_dir, 'eye2gene/users/', email,
                            params['time'], 'params.json')
      @results = File.exist? json_file ? JSON.parse(IO.read(json_file)) : {}
      slim :single_result, layout: :app_layout
    end

    # Shared Result Pages (Can be viewed without logging in)
    get '/sh/:encoded_email/:time' do
      redirect to('/login') if session[:user].nil?
      email     = Base64.decode64(params[:encoded_email])
      json_file = File.join(Eye2Gene.public_dir, 'eye2gene/share/', email,
                            params['time'], 'params.json')
      @results = File.exist? json_file ? JSON.parse(IO.read(json_file)) : {}
      slim :single_result, layout: :app_layout
    end


    get '/faq' do
      redirect to('/login') if session[:user].nil?
      slim :work_in_progress, layout: :app_layout
    end

    # Run the Eye2Gene Analysis
    post '/analyse' do
      redirect to('/login') if session[:user].nil?
      email = Base64.decode64(params[:user])
      @data = Eye2GeneAnalysis.run(params, email, base_url)
      slim :result, layout: false
    end

    post '/upload' do
      redirect to('/login') if session[:user].nil?
      dir = File.join(Eye2Gene.tmp_dir, params[:qquuid])
      FileUtils.mkdir(dir) unless File.exist?(dir)
      fname = params[:qqfilename].to_s
      fname += ".part_#{params[:qqpartindex]}" unless params[:qqtotalparts].nil?
      FileUtils.cp(params[:qqfile][:tempfile].path, File.join(dir, fname))
      { success: true }.to_json
    end

    post '/upload_done' do
      redirect to('/login') if session[:user].nil?
      parts = params[:qqtotalparts].to_i - 1
      fname = params[:qqfilename]
      dir   = File.join(Eye2Gene.tmp_dir, params[:qquuid])
      files = (0..parts).map { |i| File.join(dir, "#{fname}.part_#{i}") }
      system("cat #{files.join(' ')} > #{File.join(dir, fname)}")
      if $CHILD_STATUS.exitstatus.zero?
        system("rm #{files.join(' ')}")
        { success: true }.to_json
      else
        { success: false }.to_json
      end
    end

    # Create a share link for a result page
    post '/sh/:encoded_email/:time' do
      redirect to('/login') if session[:user].nil?
      email = Base64.decode64(params[:encoded_email])
      analysis = File.join(Eye2Gene.users_dir, email, params['time'])
      share    = File.join(Eye2Gene.public_dir, 'eye2gene/share', email)
      FileUtils.mkdir_p(share) unless File.exist? share
      FileUtils.cp_r(analysis, share)
      share_file = File.join(analysis, '.share')
      FileUtils.touch(share_file) unless File.exist? share_file
    end

    # Remove a share link of a result page
    post '/rm/:encoded_email/:time' do
      redirect to('/login') if session[:user].nil?

      email = Base64.decode64(params[:encoded_email])
      share = File.join(Eye2Gene.public_dir, 'eye2gene/share', email,
                        params['time'])
      FileUtils.rm_rf(share) if File.exist? share
      share_file = File.join(Eye2Gene.users_dir, email, params['time'], '.share')
      FileUtils.rm(share_file) if File.exist? share_file
    end

    # Delete a Results Page
    post '/delete_result' do
      redirect to('/login') if session[:user].nil?
      email = session[:email]
      results_dir = File.join(Eye2Gene.users_dir, email, params['uuid'])
      FileUtils.rm_r(results_dir)
    end

    get '/about' do
      slim :about, layout: :app_layout
    end

    get '/ppi' do
      redirect to('/login') if session[:user].nil?
      slim :ppi, layout: :app_layout
    end

    get '/login' do
      slim :login, layout: :app_layout
    end

    post '/login' do
      if params[:password] == 'eye2genedemo'
        session[:user] = 'eye2gene'
        session[:email] = 'eye2gene'
      end
      redirect to('/analyse')
    end

    get '/logout' do
      user_public_dir = File.join(Eye2Gene.public_dir, 'eye2gene/users',
                                  session[:email])
      FileUtils.rm(user_public_dir)
      session[:user] = nil
      redirect '/login'
    end

    get '/auth/failure' do
      session[:user] = nil
      redirect '/login'
    end

    # Recaptcha
    # https://stackoverflow.com/questions/21262254/what-captcha-for-sinatra
    #

    # This error block will only ever be hit if the user gives us a funny
    # parameter. Well, we could hit this block if someone is playing around
    # with our HTTP API too.
    error Eye2GeneAnalysis::ArgumentError do
      status 400
      slim :"500", layout: false
    end

    # This will catch any unhandled error and some very special errors. Ideally
    # we will never hit this block. If we do, there's a bug in GeneValidatorApp
    # or something really weird going on.
    # TODO: If we hit this error block we show the stacktrace to the user
    # requesting them to post the same to our Google Group.
    error Exception, Eye2GeneAnalysis::RuntimeError do
      status 500
      slim :"500", layout: false
    end

    not_found do
      status 404
      slim :"404", layout: false
    end
  end
end
